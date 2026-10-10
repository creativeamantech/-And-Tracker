import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vikaar_tracker_secret_key_2026_safe';
const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data', 'local_db.json');

// Ensure data folder exists
if (!fs.existsSync(path.dirname(LOCAL_DB_PATH))) {
  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
}

// Interfaces
interface UserRow {
  userId: string;
  passwordHash: string;
  name: string;
  role: 'Admin' | 'User';
  createdAt: string;
}

interface VikaarRow {
  recordId: string;
  userId: string;
  vikaarName: string;
  date: string;
  timestamp: string;
}

interface GoodDeedRow {
  recordId: string;
  userId: string;
  text: string;
  date: string;
  timestamp: string;
}

interface LocalDatabase {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  users: UserRow[];
  vikaarEntries: VikaarRow[];
  goodDeeds: GoodDeedRow[];
}

// Initial default seed
const defaultDb: LocalDatabase = {
  spreadsheetId: null,
  spreadsheetUrl: null,
  lastSyncedAt: null,
  users: [
    {
      userId: 'admin',
      passwordHash: 'admin123',
      name: 'मुख्य प्रशासक (Admin)',
      role: 'Admin',
      createdAt: new Date().toISOString(),
    },
    {
      userId: 'user1',
      passwordHash: 'pass123',
      name: 'साधक 1',
      role: 'User',
      createdAt: new Date().toISOString(),
    },
    {
      userId: 'user2',
      passwordHash: 'pass123',
      name: 'साधक 2',
      role: 'User',
      createdAt: new Date().toISOString(),
    },
  ],
  vikaarEntries: [],
  goodDeeds: [],
};

// Load or save local database
function getLocalDb(): LocalDatabase {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
    return defaultDb;
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultDb;
  }
}

function saveLocalDb(db: LocalDatabase) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// Active in-memory cached Google Token for background/server calls if provided
let activeGoogleToken: string | null = null;

// Helper function to call Google Sheets API
async function callGoogleApi(endpoint: string, options: RequestInit = {}, googleToken?: string) {
  const token = googleToken || activeGoogleToken;
  if (!token) throw new Error('No Google Access Token available');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`https://sheets.googleapis.com/v4${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google API Error (${response.status}): ${errText}`);
  }

  return response.json();
}

// Drive API helper
async function callDriveApi(endpoint: string, options: RequestInit = {}, googleToken?: string) {
  const token = googleToken || activeGoogleToken;
  if (!token) throw new Error('No Google Access Token available');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API Error (${response.status}): ${errText}`);
  }

  return response.json();
}

// Function to initialize Google Spreadsheet with required sheets
async function syncAndInitializeGoogleSheets(googleToken: string) {
  activeGoogleToken = googleToken;
  const db = getLocalDb();

  let spreadsheetId = db.spreadsheetId;

  // 1. Search for existing spreadsheet in Drive if not stored
  if (!spreadsheetId) {
    try {
      const query = encodeURIComponent("name = 'Vikaar & Good Deed Tracker DB' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
      const driveList = await callDriveApi(`/files?q=${query}&fields=files(id,name,webViewLink)`, {}, googleToken);
      if (driveList.files && driveList.files.length > 0) {
        spreadsheetId = driveList.files[0].id;
        db.spreadsheetId = spreadsheetId;
        db.spreadsheetUrl = driveList.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      }
    } catch (e) {
      console.warn('Could not search Drive:', e);
    }
  }

  // 2. If spreadsheet still does not exist, create a new one
  if (!spreadsheetId) {
    const createRes = await callGoogleApi(
      '/spreadsheets',
      {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            title: 'Vikaar & Good Deed Tracker DB',
          },
          sheets: [
            { properties: { title: 'Users' } },
            { properties: { title: 'Vikaar Entries' } },
            { properties: { title: 'Good Deeds' } },
          ],
        }),
      },
      googleToken
    );

    spreadsheetId = createRes.spreadsheetId;
    db.spreadsheetId = spreadsheetId;
    db.spreadsheetUrl = createRes.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Add headers to sheets
    await callGoogleApi(
      `/spreadsheets/${spreadsheetId}/values/Users!A1:E1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [['User ID', 'Password', 'Name', 'Role', 'Created At']],
        }),
      },
      googleToken
    );

    await callGoogleApi(
      `/spreadsheets/${spreadsheetId}/values/Vikaar Entries!A1:E1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [['Record ID', 'User ID', 'Vikaar Name', 'Date', 'Timestamp']],
        }),
      },
      googleToken
    );

    await callGoogleApi(
      `/spreadsheets/${spreadsheetId}/values/Good Deeds!A1:E1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [['Record ID', 'User ID', 'Good Deed Text', 'Date', 'Timestamp']],
        }),
      },
      googleToken
    );

    // Append seed users
    const userValues = db.users.map((u) => [u.userId, u.passwordHash, u.name, u.role, u.createdAt]);
    await callGoogleApi(
      `/spreadsheets/${spreadsheetId}/values/Users!A2:E:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        body: JSON.stringify({ values: userValues }),
      },
      googleToken
    );
  } else {
    // Spreadsheet exists: Read existing data from Google Sheets into local cache
    try {
      const sheetsData = await callGoogleApi(
        `/spreadsheets/${spreadsheetId}/values:batchGet?ranges=Users!A2:E&ranges=Vikaar Entries!A2:E&ranges=Good Deeds!A2:E`,
        {},
        googleToken
      );

      const valueRanges = sheetsData.valueRanges || [];
      const userRows = valueRanges[0]?.values || [];
      const vikaarRows = valueRanges[1]?.values || [];
      const deedRows = valueRanges[2]?.values || [];

      if (userRows.length > 0) {
        db.users = userRows.map((r: string[]) => ({
          userId: r[0] || '',
          passwordHash: r[1] || '',
          name: r[2] || '',
          role: (r[3] as 'Admin' | 'User') || 'User',
          createdAt: r[4] || new Date().toISOString(),
        })).filter((u: UserRow) => u.userId);
      } else {
        // If Users sheet is empty, seed initial users
        const userValues = db.users.map((u) => [u.userId, u.passwordHash, u.name, u.role, u.createdAt]);
        await callGoogleApi(
          `/spreadsheets/${spreadsheetId}/values/Users!A2:E:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            body: JSON.stringify({ values: userValues }),
          },
          googleToken
        );
      }

      db.vikaarEntries = vikaarRows.map((r: string[]) => ({
        recordId: r[0] || `VK-${Date.now()}`,
        userId: r[1] || '',
        vikaarName: r[2] || '',
        date: r[3] || '',
        timestamp: r[4] || '',
      })).filter((v: VikaarRow) => v.userId && v.vikaarName);

      db.goodDeeds = deedRows.map((r: string[]) => ({
        recordId: r[0] || `GD-${Date.now()}`,
        userId: r[1] || '',
        text: r[2] || '',
        date: r[3] || '',
        timestamp: r[4] || '',
      })).filter((g: GoodDeedRow) => g.userId && g.text);

    } catch (err) {
      console.warn('Failed to pull from Google Sheets during sync, using cached data:', err);
    }
  }

  db.lastSyncedAt = new Date().toISOString();
  saveLocalDb(db);

  return {
    spreadsheetId: db.spreadsheetId,
    spreadsheetUrl: db.spreadsheetUrl,
    userCount: db.users.length,
    vikaarEntryCount: db.vikaarEntries.length,
    goodDeedCount: db.goodDeeds.length,
  };
}

// Function to append a row to Google Sheets
async function appendRowToGoogleSheet(
  sheetName: string,
  rowValues: string[],
  googleToken?: string
) {
  const db = getLocalDb();
  if (!db.spreadsheetId) return;

  const token = googleToken || activeGoogleToken;
  if (!token) return;

  try {
    await callGoogleApi(
      `/spreadsheets/${db.spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:E:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        body: JSON.stringify({ values: [rowValues] }),
      },
      token
    );
  } catch (e) {
    console.error(`Failed to append row to Google Sheet (${sheetName}):`, e);
  }
}

// Express App Initialization
const app = express();
app.use(express.json());

// Express Auth Middleware
interface AuthRequest extends Request {
  user?: {
    userId: string;
    name: string;
    role: 'Admin' | 'User';
  };
  googleToken?: string;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const googleTokenHeader = req.headers['x-google-token'] as string;

  if (googleTokenHeader) {
    req.googleToken = googleTokenHeader;
    activeGoogleToken = googleTokenHeader;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'लॉगइन आवश्यक है (Authentication token missing)' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'अमान्य या समाप्त टोकन (Invalid or expired token)' });
  }
}

function adminOnlyMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'केवल प्रशासक के लिए अनुमति है (Admin access required)' });
  }
  next();
}

// ================= API ROUTES =================

// 1. Google Sheets Connection Sync Route
app.post('/api/sheets/connect', async (req: Request, res: Response) => {
  const googleToken = req.headers['x-google-token'] as string || req.body.googleToken;
  if (!googleToken) {
    return res.status(400).json({ error: 'Google Access Token is required' });
  }

  try {
    const result = await syncAndInitializeGoogleSheets(googleToken);
    return res.json({
      success: true,
      message: 'Google Sheets डेटाबेस सफलतापूर्वक कनेक्ट हुआ!',
      ...result,
    });
  } catch (error: any) {
    console.error('Google Sheets Sync Error:', error);
    return res.status(500).json({
      error: `Google Sheets कनेक्शन में त्रुटि: ${error.message}`,
    });
  }
});

// 2. DB Status Route
app.get('/api/sheets/status', (req: Request, res: Response) => {
  const db = getLocalDb();
  return res.json({
    connected: Boolean(db.spreadsheetId),
    spreadsheetId: db.spreadsheetId,
    spreadsheetUrl: db.spreadsheetUrl,
    lastSyncedAt: db.lastSyncedAt,
    userCount: db.users.length,
    vikaarEntryCount: db.vikaarEntries.length,
    goodDeedCount: db.goodDeeds.length,
    storageType: db.spreadsheetId ? 'Google Sheets' : 'Local Vault (Syncing to Sheets)',
  });
});

// 3. Auth Login Route (User ID & Password)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'उपयोगकर्ता आईडी एवं पासवर्ड आवश्यक हैं (User ID and Password required)' });
  }

  const db = getLocalDb();
  const trimmedId = String(userId).trim().toLowerCase();

  const foundUser = db.users.find(
    (u) => u.userId.toLowerCase() === trimmedId && u.passwordHash === password
  );

  if (!foundUser) {
    return res.status(401).json({ error: 'गलत उपयोगकर्ता आईडी या पासवर्ड (Invalid User ID or Password)' });
  }

  const tokenPayload = {
    userId: foundUser.userId,
    name: foundUser.name,
    role: foundUser.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    success: true,
    token,
    user: {
      userId: foundUser.userId,
      name: foundUser.name,
      role: foundUser.role,
    },
  });
});

// 4. Current User Info
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// 5. Add Vikaar Entry (One Tap)
app.post('/api/vikaar/add', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { vikaarName } = req.body;
  const VALID_VIKAARS = ['काम', 'क्रोध', 'लोभ', 'मोह', 'माया', 'अहंकार', 'ईर्ष्या', 'डर', 'घृणा', 'आलस्य'];

  if (!vikaarName || !VALID_VIKAARS.includes(vikaarName)) {
    return res.status(400).json({ error: 'अमान्य विकार नाम (Invalid Vikaar name)' });
  }

  const userId = req.user!.userId;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timestampStr = now.toISOString();
  const recordId = `VK-${now.getTime()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const newEntry: VikaarRow = {
    recordId,
    userId,
    vikaarName,
    date: dateStr,
    timestamp: timestampStr,
  };

  // Save to local DB cache
  const db = getLocalDb();
  db.vikaarEntries.push(newEntry);
  saveLocalDb(db);

  // Append to Google Sheets asynchronously
  const googleToken = req.headers['x-google-token'] as string;
  appendRowToGoogleSheet(
    'Vikaar Entries',
    [recordId, userId, vikaarName, dateStr, timestampStr],
    googleToken
  ).catch((e) => console.error('Background sheet append failed:', e));

  // Compute today's counts for logged-in user
  const todayEntries = db.vikaarEntries.filter(
    (e) => e.userId === userId && e.date === dateStr
  );

  const todayCounts: Record<string, number> = {};
  VALID_VIKAARS.forEach((v) => (todayCounts[v] = 0));
  todayEntries.forEach((e) => {
    if (todayCounts[e.vikaarName] !== undefined) {
      todayCounts[e.vikaarName]++;
    }
  });

  return res.json({
    success: true,
    message: `${vikaarName} रिकॉर्ड दर्ज हुआ!`,
    record: newEntry,
    todayCounts,
  });
});

// 6. Get User's Vikaar Counts
app.get('/api/vikaar/my-counts', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const db = getLocalDb();
  const userEntries = db.vikaarEntries.filter((e) => e.userId === userId);

  const VALID_VIKAARS = ['काम', 'क्रोध', 'लोभ', 'मोह', 'माया', 'अहंकार', 'ईर्ष्या', 'डर', 'घृणा', 'आलस्य'];

  const selectedDateCounts: Record<string, number> = {};
  const overallCounts: Record<string, number> = {};
  const dailyHistory: Record<string, { counts: Record<string, number>; total: number }> = {};

  VALID_VIKAARS.forEach((v) => {
    selectedDateCounts[v] = 0;
    overallCounts[v] = 0;
  });

  userEntries.forEach((e) => {
    if (e.date === targetDate && selectedDateCounts[e.vikaarName] !== undefined) {
      selectedDateCounts[e.vikaarName]++;
    }
    if (overallCounts[e.vikaarName] !== undefined) {
      overallCounts[e.vikaarName]++;
    }

    if (!dailyHistory[e.date]) {
      const c: Record<string, number> = {};
      VALID_VIKAARS.forEach((v) => (c[v] = 0));
      dailyHistory[e.date] = { counts: c, total: 0 };
    }
    if (dailyHistory[e.date].counts[e.vikaarName] !== undefined) {
      dailyHistory[e.date].counts[e.vikaarName]++;
      dailyHistory[e.date].total++;
    }
  });

  return res.json({
    date: targetDate,
    todayCounts: selectedDateCounts,
    overallCounts,
    totalToday: Object.values(selectedDateCounts).reduce((a, b) => a + b, 0),
    totalOverall: userEntries.length,
    dailyHistory,
  });
});

// 7. Add Good Deed
app.post('/api/good-deeds/add', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { text, date } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'कृपया अच्छा काम विवरण दर्ज करें (Please write good deed text)' });
  }

  const userId = req.user!.userId;
  const now = new Date();
  const dateStr = date || now.toISOString().split('T')[0];
  const timestampStr = now.toISOString();
  const recordId = `GD-${now.getTime()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const newDeed: GoodDeedRow = {
    recordId,
    userId,
    text: text.trim(),
    date: dateStr,
    timestamp: timestampStr,
  };

  const db = getLocalDb();
  db.goodDeeds.unshift(newDeed); // Recent first
  saveLocalDb(db);

  // Append to Google Sheet
  const googleToken = req.headers['x-google-token'] as string;
  appendRowToGoogleSheet(
    'Good Deeds',
    [recordId, userId, text.trim(), dateStr, timestampStr],
    googleToken
  ).catch((e) => console.error('Background good deed append failed:', e));

  return res.json({
    success: true,
    message: 'आज का अच्छा काम सफलतापूर्वक सहेजा गया!',
    deed: newDeed,
  });
});

// 8. Get User's Good Deeds
app.get('/api/good-deeds/my-deeds', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const db = getLocalDb();

  const myDeeds = db.goodDeeds
    .filter((g) => g.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return res.json({ deeds: myDeeds });
});

// 9. Admin Reports Route
app.get('/api/reports/admin', authMiddleware, adminOnlyMiddleware, (req: AuthRequest, res: Response) => {
  const db = getLocalDb();
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const VALID_VIKAARS = ['काम', 'क्रोध', 'लोभ', 'मोह', 'माया', 'अहंकार', 'ईर्ष्या', 'डर', 'घृणा', 'आलस्य'];

  // Users list without passwords
  const usersList = db.users.map((u) => ({
    userId: u.userId,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  }));

  // Aggregated Vikaar totals across all users (Overall & Date-wise)
  const overallTotals: Record<string, number> = {};
  const selectedDateTotals: Record<string, number> = {};
  VALID_VIKAARS.forEach((v) => {
    overallTotals[v] = 0;
    selectedDateTotals[v] = 0;
  });

  db.vikaarEntries.forEach((e) => {
    if (overallTotals[e.vikaarName] !== undefined) {
      overallTotals[e.vikaarName]++;
    }
    if (e.date === targetDate && selectedDateTotals[e.vikaarName] !== undefined) {
      selectedDateTotals[e.vikaarName]++;
    }
  });

  // Per user breakdown (Overall & Selected Date)
  const userBreakdown: Record<
    string,
    {
      userId: string;
      name: string;
      totalEntries: number;
      dateEntries: number;
      counts: Record<string, number>;
      dateCounts: Record<string, number>;
      goodDeedsCount: number;
      dateGoodDeedsCount: number;
    }
  > = {};

  db.users.forEach((u) => {
    const userCounts: Record<string, number> = {};
    const userDateCounts: Record<string, number> = {};
    VALID_VIKAARS.forEach((v) => {
      userCounts[v] = 0;
      userDateCounts[v] = 0;
    });

    userBreakdown[u.userId] = {
      userId: u.userId,
      name: u.name,
      totalEntries: 0,
      dateEntries: 0,
      counts: userCounts,
      dateCounts: userDateCounts,
      goodDeedsCount: 0,
      dateGoodDeedsCount: 0,
    };
  });

  db.vikaarEntries.forEach((e) => {
    if (userBreakdown[e.userId]) {
      userBreakdown[e.userId].totalEntries++;
      if (userBreakdown[e.userId].counts[e.vikaarName] !== undefined) {
        userBreakdown[e.userId].counts[e.vikaarName]++;
      }

      if (e.date === targetDate) {
        userBreakdown[e.userId].dateEntries++;
        if (userBreakdown[e.userId].dateCounts[e.vikaarName] !== undefined) {
          userBreakdown[e.userId].dateCounts[e.vikaarName]++;
        }
      }
    }
  });

  db.goodDeeds.forEach((g) => {
    if (userBreakdown[g.userId]) {
      userBreakdown[g.userId].goodDeedsCount++;
      if (g.date === targetDate) {
        userBreakdown[g.userId].dateGoodDeedsCount++;
      }
    }
  });

  return res.json({
    date: targetDate,
    users: usersList,
    overallTotals,
    selectedDateTotals,
    totalDateEntries: Object.values(selectedDateTotals).reduce((a, b) => a + b, 0),
    userBreakdown: Object.values(userBreakdown),
    totalVikaarEntries: db.vikaarEntries.length,
    totalGoodDeeds: db.goodDeeds.length,
    allGoodDeeds: db.goodDeeds.slice(0, 100), // Recent 100 good deeds
  });
});

// 10. Admin Add New User
app.post('/api/admin/users/add', authMiddleware, adminOnlyMiddleware, async (req: AuthRequest, res: Response) => {
  const { newUserId, password, name, role } = req.body;

  if (!newUserId || !password || !name) {
    return res.status(400).json({ error: 'उपयोगकर्ता आईडी, नाम और पासवर्ड आवश्यक हैं' });
  }

  const db = getLocalDb();
  const trimmedId = String(newUserId).trim().toLowerCase();

  if (db.users.some((u) => u.userId.toLowerCase() === trimmedId)) {
    return res.status(400).json({ error: 'यह उपयोगकर्ता आईडी पहले से मौजूद है' });
  }

  const newUser: UserRow = {
    userId: String(newUserId).trim(),
    passwordHash: password,
    name: name.trim(),
    role: role === 'Admin' ? 'Admin' : 'User',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveLocalDb(db);

  // Append to Google Sheet
  const googleToken = req.headers['x-google-token'] as string;
  appendRowToGoogleSheet(
    'Users',
    [newUser.userId, newUser.passwordHash, newUser.name, newUser.role, newUser.createdAt],
    googleToken
  ).catch((e) => console.error('Background user append failed:', e));

  return res.json({
    success: true,
    message: `नया उपयोगकर्ता '${newUser.userId}' सफलतापूर्वक जोड़ा गया!`,
    user: {
      userId: newUser.userId,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
  });
});

// Setup Vite or Static Server
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Vikaar Tracker App running on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
