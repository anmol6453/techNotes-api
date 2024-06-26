const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');

// @desc: Get all notes
// @route: GET /notes
// @access: Private

const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean();
    if(!notes?.length){
        return res.status(400).json({message: 'No notes found'});
    }

    const notesWithUser = await Promise.all(notes.map( async (note) => {
        const user = await User.findById(note.user).lean().exec();
        return {...note, username: user.username};
    }));

    res.json(notesWithUser);
});

// @desc: Create notes
// @route: POST /notes
// @access: Private

const createNotes = asyncHandler(async (req, res) => {
    const {user, title, text} = req.body;

    // Confirm data
    if(!user || !title || !text){
        return res.status(400).json({message: 'All fields are required'});
    }

    // Check duplicate title
    const duplicate = await Note.findOne({title}).collation({locale: 'en', strength: 2}).lean().exec();
    if(duplicate){
        return res.status(409).json({message: 'Duplicate note title'});
    }

    
    // Create and store note
    const noteObject = {user, title, text};
    const note = await Note.create(noteObject);
    if(note){
        res.status(201).json({message: `New note created.`});
    }
    else{
        res.status(400).json({message: 'Invalid note data received'});
    }
});

// @desc: Update existing note
// @route: PATCH /notes
// @access: Private

const updateNotes = asyncHandler(async (req, res) => {
    const {id, user, title, text, completed} = req.body;

    if(!id || !user || !title || !text || typeof completed !== 'boolean'){
        return res.status(400).json({message: 'All fields are required'});
    }

    const note = await Note.findById(id).exec();
    if(!note){
        return res.status(400).json({message: 'Note not found'});
    }

    // Check Duplicates title
    const duplicate = await Note.findOne({title}).collation({locale: 'en', strength: 2}).lean().exec();
    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: 'Duplicate title'});
    }

    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;

    const updatedNote = await note.save();

    res.json({message: `${updatedNote.title} updated`});

});

// @desc: Delete notes
// @route: DELETE /notes
// @access: Private

const deleteNotes = asyncHandler(async (req, res) => {
    const {id} = req.body;
    if(!id){
        return res.status(400).json({message: 'Note ID Required'});
    }

    const note = await Note.findById(id).exec();
    if(!note){
        return res.status(400).json({message: 'Note not found'});
    }

    const result = await Note.findOneAndDelete({"_id" : id});

    // const reply = `Note ${result.title} with ID ${result._id} deleted`;

    res.json(`Note ${result.title} with ID ${result._id} deleted`);
});

module.exports = {
    getAllNotes,
    createNotes,
    updateNotes,
    deleteNotes
};