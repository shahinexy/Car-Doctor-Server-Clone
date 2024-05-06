const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
const jwt = require('jsonwebtoken')
// const cookieParse = require('cookie-parser')
const cookieparser = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// midlewear 
// app.use(cors())

// app.use(cors({
//   origin: ["http://localhost:5000"],
//   credentials: true,
// }))

app.use(express.json())

// app.use(cookiesParse())
app.use(cookieparser())

// const corsConfig = {
//   origin: ["http://localhost:5173"],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE']
// };
// app.use(cors(corsConfig));

const corConfig = {
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corConfig))



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.76h69in.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// ===== Won midlewear =====
const logger = (req, res, next) => {
  console.log('log: info', req.method, req.url);
  next()
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token in midlewear', token);
  if (!token) {
    res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
    if(err){
      res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}


async function run() {
  try {
    await client.connect();

    const carCollection = client.db("carDoctor").collection('services');
    const checkOutCollection = client.db("carDoctor").collection('checkOut');

    // ========== auth related =========
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logout user', user);
      res
        .clearCookie('token', { maxAge: 0 })
        .send({ success: true })
    })


    // service related
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


    // check out ======
    app.post('/checkOut', async (req, res) => {
      const checkout = req.body;
      const result = await checkOutCollection.insertOne(checkout);
      res.send(result)
    })

    app.get('/checkOut', logger, verifyToken, async (req, res) => {
      // console.log('token====>', req.cookies.token);
      console.log('cookie', req.query.email);
      console.log("token woner info", req.user);

      if(req.user.email !== req.query.email){
        return res.status(403).send({message: 'forbiden access'})
      }

      let query = {}
      if (req.query.email) {
        query = { email: req.query?.email }
      }
      const result = await checkOutCollection.find(query).toArray()
      res.send(result)
    })

    app.patch('/checkOut/:id', async (req, res) => {
      const data = req.body;
      const filter = { _id: new ObjectId(req.params.id) }
      const updateData = {
        $set: {
          status: data.status
        }
      }
      const result = await checkOutCollection.updateOne(filter, updateData)
      res.send(result)
    })

    app.delete('/checkOut/:id', async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) }
      const result = await checkOutCollection.deleteOne(query)
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