// const dataset = require("./data.js");
const bluewin = require("./bluewin.js");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");
const { MongoClient } = require('mongodb');

const { error } = require("jquery");

const mongoURI = "mongodb://127.0.0.1:27017/";
const mongoClient = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });


async function main() {
  try {
    try {
      await mongoClient.connect();
      console.log('Connected successfully to MongoDB');
    } catch (error) {
      console.error('Connection to MongoDB failed', error);
      throw error;
    }

    try {
      const mysqlConnection = await mysql.createConnection({
        host: "news-crawl.cluster-ckz6b4latkvz.eu-central-1.rds.amazonaws.com",
        user: "News_Crawl",
        password: "%fdhG7J%hXH%Jm7rdbv&",
        database: "news",
      });

      const [rows] = await mysqlConnection.execute("SELECT * FROM articles WHERE loaded = 0 and source='https://www.bluewin.ch'")
      
      for(var i = 0; i < rows.length; i ++ ) {
        let row = rows[i];
        const result = await bluewin.scrapeArticleInformation(row.link);
        if( result ) {
          try {
            row.published = result.article.published;
            row.content = result.article.content;
            row.type = result.article.type;
            row.created_at = new Date();
  
            const collection = mongoClient.db('BildNews').collection('articles');
            await collection.insertOne(row);
            await mysqlConnection.execute('UPDATE articles SET loaded = 1 WHERE id = ?', [row.id])
          } catch(err) {
            await mysqlConnection.execute('UPDATE articles SET loaded = -1 WHERE id = ?', [row.id])
          }
        }
      }

    } catch (error) {
      console.error('Connection to Mysql failed:', error);
      throw error;
    }
  } catch (error) {
  }

  // while (true) {}
}

// async function main1() {
//   try {
//     await mongoClient.connect();
//     console.log('Connected successfully to MongoDB');

//     const collection = mongoClient.db('BildNews').collection('articles');
//     const cursor = collection.find({});
//     const allArticles = await cursor.toArray();

//     for (let article of allArticles) {
//       const result = await bluewin.scrapeArticleInformation(article.link);
//       if( result ) {
//         try {
//           article.type = result.article.type;
//           await collection.updateOne({ _id: article._id }, { $set: article });

//           console.log(`Updated document with _id ${data._id}`);
//           console.log(article);
//         } catch(err) {

//         }
//       }
//     }
//   } catch (error) {
//     console.error('Connection to MongoDB failed', error);
//     throw error;
//   }
// }


main();

setInterval(main, 30 * 60 * 1000);