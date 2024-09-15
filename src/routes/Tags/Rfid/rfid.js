const express = require('express');
const { validateRfid, getAllRfids, removeRfid, assignRfidToUser } = require('./utils/rfid');
const { validateRequestBody } = require('../../../helpers/validate/fields');
const updateFront = require('../../../helpers/socket/update')

const router = new express.Router();

router.post('/door/:rfid', async (req, res) => {
    const { rfid } = req.params;

    try {
        const isValid = await validateRfid(rfid);
        if (isValid) {
            updateFront()
            return res.status(200).json({ message: 'Door open' });
        }
        updateFront()
        res.status(401).json({ message: 'Door closed' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

router.post('/assign', async (req, res) => {
    const { rfid, userId } = req.body;

    const error = validateRequestBody(['rfid', 'userId'], req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    try {
        const isAssigned = await assignRfidToUser(rfid, userId);
        if (isAssigned) {
            return res.status(200).json({ message: 'RFID assigned to user successfully' });
        }
        res.status(401).json({ message: 'RFID not assigned' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const allRfids = await getAllRfids();
        res.status(200).json({ data: allRfids });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

router.post('/:rfid', async (req, res) => {
    const { rfid } = req.params;

    try {
        const isValid = await validateRfid(rfid);
        if (isValid) {
            return res.status(409).json({ message: 'RFID already exists' });
        }
        res.status(201).json({ message: 'RFID created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

router.delete('/delete/:rfid', async (req, res) => {
    const { rfid } = req.params;

    try {
        const deletedRfid = await removeRfid(rfid);
        res.status(200).json({ message: 'RFID deleted successfully', data: deletedRfid });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;