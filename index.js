const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// midlewear 
app.use(cors())

// const corsConfig = {
//   origin: ["http://localhost:5173"],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE']
// };
// app.use(cors(corsConfig));

app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.76h69in.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const carCollection = client.db("carDoctor").collection('services');
    const checkOutCollection = client.db("carDoctor").collection('checkOut');

    app.get('/services', async (req, res) => {
      const result = await carCollection.find().toArray();
      res.send(result)
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const options = {
        projection: { title: 1, img: 1, price: 1 }
      };

      const result = await carCollection.findOne(query, options);
      res.send(result)
    })


    // check out
    app.post('/checkOut', async (req, res) => {
      const checkout = req.body;
      console.log(checkout);
      const result = await checkOutCollection.insertOne(checkout);
      console.log(checkout, result);
      res.send(result)
    })

    app.get('/checkOut', async (req, res) => {
      console.log(req.query?.email);
      let query = {}
      if (req.query.email) {
        query = { email: req.query?.email }
      }
      const result = await checkOutCollection.find(query).toArray()
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("Car Doctor server running")
})

app.listen(port, () => {
  console.log(`Car Doctor server is running on Port: ${port}`);
})