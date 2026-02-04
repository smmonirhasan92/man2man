const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');

app.use(express.json());

// Mount directly
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('Debug Server'));

app.listen(5001, () => console.log('Debug Server running on 5001'));
