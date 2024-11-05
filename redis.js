// const redis = require('redis')

// const client = redis.createClient({
//     host: 'redis',
//     port: 6379 
// });

// client.on('connect', () => {
//     console.log('Connected to Redis server');
// });

// client.on('error', (err) => {
//     console.log(err.message);
// });

// client.on('ready', () => {
//     console.log('Redis is ready');
// });



const { createClient } = require('redis');

// Create a Redis client and connect to the Redis server using Docker service name
const client = createClient({
    url: 'redis://localhost:6379',
    socket: {
        connectTimeout: 10000, // Increase timeout to 10 seconds
    },
});

// Connect to Redis server
client.connect()
    .then(() => {
        console.log('Connected to Redis server');
    })
    .catch(err => {
        console.error('Redis connection error:', err);
    });

module.exports = {
    client
};