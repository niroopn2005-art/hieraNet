const express = require('express');
const app = express();
const testRoutes = require('./routes/testRoute');

app.use('/api', testRoutes); 