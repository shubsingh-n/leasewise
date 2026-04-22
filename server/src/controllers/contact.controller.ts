import express from 'express';
import Property from '../models/Property';
import FlatmateRequirement from '../models/FlatmateRequirement';
import ContactRequest from '../models/ContactRequest';
import { sendTelegramMessage, formatContactRequestMessage } from '../services/telegram.service';

export const createContactRequest = async (req: express.Request, res: express.Response) => {
  try {
    const { requesterName, requesterPhone, listingId, listingType } = req.body;

    if (!requesterName || !requesterPhone || !listingId || !listingType) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    let listingTitle = '';
    let ownerName = '';
    let ownerPhone = '';

    if (listingType === 'Property') {
      const property = await Property.findById(listingId);
      if (!property) return res.status(404).json({ message: 'Property not found.' });
      listingTitle = property.title;
      ownerName = property.contact.name || 'Owner';
      ownerPhone = property.contact.whatsapp;
    } else {
      const flatmate = await FlatmateRequirement.findById(listingId);
      if (!flatmate) return res.status(404).json({ message: 'Flatmate requirement not found.' });
      listingTitle = `Flatmate - ${flatmate.name}`;
      ownerName = flatmate.name;
      ownerPhone = flatmate.contact.whatsapp;
    }

    // Save to database
    const contactRequest = await ContactRequest.create({
      requesterName,
      requesterPhone,
      listingId,
      listingType,
      listingTitle,
      ownerPhone,
      ownerName
    });

    // Send Telegram Notification
    const message = formatContactRequestMessage({
      requesterName,
      requesterPhone,
      listingTitle,
      ownerName,
      ownerPhone
    });

    try {
      await sendTelegramMessage(message);
      contactRequest.status = 'notified';
      await contactRequest.save();
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
      // We still return 201 because the request is saved in DB
    }

    res.status(201).json(contactRequest);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getContactRequests = async (req: express.Request, res: express.Response) => {
  try {
    const requests = await ContactRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const retriggerContactNotification = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const contactRequest = await ContactRequest.findById(id);
    if (!contactRequest) return res.status(404).json({ message: 'Request not found.' });

    const message = formatContactRequestMessage({
      requesterName: contactRequest.requesterName,
      requesterPhone: contactRequest.requesterPhone,
      listingTitle: contactRequest.listingTitle,
      ownerName: contactRequest.ownerName,
      ownerPhone: contactRequest.ownerPhone
    });

    await sendTelegramMessage(message);
    
    // Update status to notified if it wasn't already
    if (contactRequest.status !== 'notified') {
      contactRequest.status = 'notified';
      await contactRequest.save();
    }

    res.json({ message: 'Notification resent successfully!' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const debugTelegramSetup = async (req: express.Request, res: express.Response) => {
  try {
    const { testTelegramConnection } = require('../services/telegram.service');
    await testTelegramConnection();
    res.json({ message: 'Test message sent! Check your Telegram.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
