const keys = require('./keys');
const redis = require('redis');

// create redis client ...
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,  // if it ever looses connection, try every second ...
});
const sub = redisClient.duplicate();  // create duplicate of redis client

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// any time we get new message in redis, run this function ! 
sub.on('message', (channel, message) => {
  // insert in hash of 'values' and calculate fib(function)
  redisClient.hset('values', message, fib(parseInt(message)));
});
// subscribe on any insert event ...
sub.subscribe('insert');
