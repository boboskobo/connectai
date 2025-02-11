import express from 'express';

const app = express();
app.use(express.json());

// Store created people in memory for testing
const people = new Map();

// Mock People endpoint
app.post('/mock-rock/api/People', (req, res) => {
    const person = {
        Id: Date.now(),
        ...req.body,
        Family: { Id: Date.now() + 1 } // Simulate auto-created family
    };
    people.set(person.Id, person);
    console.log('👤 Created person:', person);
    res.json(person);
});

app.get('/mock-rock/api/People/:id', (req, res) => {
    const person = people.get(parseInt(req.params.id));
    if (!person) {
        return res.status(404).json({ error: 'Person not found' });
    }
    res.json(person);
});

app.patch('/mock-rock/api/People/:id', (req, res) => {
    const person = people.get(parseInt(req.params.id));
    if (!person) {
        return res.status(404).json({ error: 'Person not found' });
    }
    Object.assign(person, req.body);
    console.log('👤 Updated person:', person);
    res.json(person);
});

// Mock Groups (Family) endpoint
app.patch('/mock-rock/api/Groups/:id', (req, res) => {
    console.log('👨‍👩‍👧‍👦 Updated family:', { id: req.params.id, ...req.body });
    res.json({ Id: parseInt(req.params.id), ...req.body });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🎭 Mock Rock RMS server running at http://localhost:${PORT}/mock-rock`);
    console.log('Ready to receive test requests!\n');
}); 