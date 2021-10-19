const keys = require('./keys');

// Express app setup, we will require express, body-parser and cors libraries..
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();  // server will accept any request to react application
app.use(cors());  // allow us to make requests from one domain to different domain
app.use(bodyParser.json()); // gona parse incomming requests to react server to json 

// postgres client setup
// create and connect to postgres server
const {Pool} = require('pg');
const { pgPassword } = require('./keys');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', ()=> console.log('Lost PG connection !'));
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
.catch(err => console.log(err));


// redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: ()=> 1000
});
// we must have duplicate client. 
const redisPublisher = redisClient.duplicate();

// express route handlers 
app.get('/', (req, res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows)
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    })
});

app.post('/values', async (req,res) => {
    const index = req.body.index;
    if(parent(index)>40){
        return res.status(422).send('Index to high');
    }
    redisClient.hset('values', index, 'Nothing yet');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({working: true});
});

app.listen(5000, err => {
    console.log('Listening');
});


