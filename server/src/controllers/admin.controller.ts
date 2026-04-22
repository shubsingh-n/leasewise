import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Property from '../models/Property';
import FlatmateRequirement from '../models/FlatmateRequirement';

// POST /api/admin/login
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '8h') as string;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const emailMatch = email === adminEmail;
  const passMatch = password === adminPassword;

  if (!emailMatch || !passMatch) {
    // Always wait a bit to prevent timing-based user enumeration
    await new Promise(r => setTimeout(r, 300));
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ email }, jwtSecret, { expiresIn } as any);
  res.json({ token, expiresIn });
};

// GET /api/admin/listings — all properties with status
export const getAdminListings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [properties, flatmates] = await Promise.all([
      Property.find().sort({ createdAt: -1 }).lean(),
      FlatmateRequirement.find().sort({ createdAt: -1 }).lean()
    ]);

    // Fetch all approved listings to calculate current active counts
    const [approvedProps, approvedReqs] = await Promise.all([
      Property.find({ status: 'approved' }).select('contact.whatsapp').lean(),
      FlatmateRequirement.find({ status: 'approved' }).select('contact.whatsapp').lean()
    ]);

    // Create lookup maps for counts
    const propCounts: Record<string, number> = {};
    const reqCounts: Record<string, number> = {};

    approvedProps.forEach(p => {
      const wa = p.contact.whatsapp;
      if (wa) propCounts[wa] = (propCounts[wa] || 0) + 1;
    });

    approvedReqs.forEach(r => {
      const wa = r.contact.whatsapp;
      if (wa) reqCounts[wa] = (reqCounts[wa] || 0) + 1;
    });

    // Attach counts to response items
    const enhancedProperties = properties.map(p => ({
      ...p,
      activePropertyCount: propCounts[p.contact.whatsapp] || 0,
      activeRequirementCount: reqCounts[p.contact.whatsapp] || 0
    }));

    const enhancedFlatmates = flatmates.map(f => ({
      ...f,
      activePropertyCount: propCounts[f.contact.whatsapp] || 0,
      activeRequirementCount: reqCounts[f.contact.whatsapp] || 0
    }));

    res.json({ properties: enhancedProperties, flatmates: enhancedFlatmates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/properties/:id/approve
export const approveProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);
    const doc = await Property.findByIdAndUpdate(req.params.id, { 
      status: 'approved',
      expiresAt: expiresAt
    }, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/properties/:id/reject
export const rejectProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const doc = await Property.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason }, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/flatmates/:id/approve
export const approveFlatmate = async (req: Request, res: Response): Promise<void> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);
    const doc = await FlatmateRequirement.findByIdAndUpdate(req.params.id, { 
      status: 'approved',
      expiresAt: expiresAt
    }, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/flatmates/:id/reject
export const rejectFlatmate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const doc = await FlatmateRequirement.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason }, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/properties/:id/reactivate
export const reactivateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);
    const doc = await Property.findByIdAndUpdate(req.params.id, { 
      status: 'approved',
      expiresAt: expiresAt,
      lastNotifiedAt: undefined // Reset notification for the new period
    }, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/flatmates/:id/reactivate
export const reactivateFlatmate = async (req: Request, res: Response): Promise<void> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);
    const doc = await FlatmateRequirement.findByIdAndUpdate(req.params.id, { 
      status: 'approved',
      expiresAt: expiresAt,
      lastNotifiedAt: undefined
    }, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/listings/reactivate-public/:type/:id?token=...
import { generateReactivateToken } from '../services/expiration.service';
export const reactivatePublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, id } = req.params;
    const { token } = req.query;

    const item = type === 'property' ? await Property.findById(id) : await FlatmateRequirement.findById(id);

    if (!item) {
      res.status(404).send('<h1>Listing not found</h1>');
      return;
    }

    // Verify token
    if (!item.expiresAt) {
        res.status(400).send('<h1>Listing has no expiration set</h1>');
        return;
    }

    const expectedToken = generateReactivateToken(id as string, item.expiresAt!);
    if ((token as string) !== expectedToken) {
      res.status(403).send('<h1>Invalid or expired reactivation link</h1>');
      return;
    }

    // Reactivate
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 10);
    item.status = 'approved';
    item.expiresAt = newExpiresAt;
    (item as any).lastNotifiedAt = undefined;
    await item.save();

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #4f46e5;">Listing Reactivated! ✅</h1>
        <p>The listing <b>"${type === 'property' ? (item as any).title : (item as any).name}"</b> has been extended for another 10 days.</p>
        <p>You can close this window now.</p>
      </div>
    `);
  } catch (error: any) {
    res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
};

// DELETE /api/admin/properties/:id
export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/properties/:id — Admin edit
export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/flatmates/:id
export const deleteFlatmate = async (req: Request, res: Response): Promise<void> => {
  try {
    await FlatmateRequirement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/flatmates/:id — Admin edit
export const updateFlatmate = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await FlatmateRequirement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
