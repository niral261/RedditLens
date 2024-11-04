const { Kafka } = require('kafkajs');
const { Client } = require('@elastic/elasticsearch');
const dotenv = require("dotenv");

dotenv.config();

const kafka = new Kafka({
  clientId: 'reddit-client',
  brokers: [process.env.KAFKA_BROKER]
});

const consumer = kafka.consumer({ groupId: 'reddit-group' });
const esClient = new Client({ node: 'http://localhost:9200', auth: { username: 'elastic', password: 'niral' } });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'reddit_posts', fromBeginning: true });

  // Create index if it doesn't exist
  const indexExists = await esClient.indices.exists({ index: 'reddit-posts' });
  if (!indexExists.body) {
      await esClient.indices.create({
          index: 'reddit-posts',
          body: {
              mappings: {
                  properties: {
                      title: { type: 'text' },
                      // Add more mappings as needed
                  },
              },
          },
      });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const redditPost = JSON.parse(message.value.toString());

      // Index the data into Elasticsearch
      await esClient.index({
        index: 'reddit-posts',
        body: redditPost,
      });

      console.log(`Produced: ${redditPost.title}`);
    },
  });
};

run().catch(console.error);
