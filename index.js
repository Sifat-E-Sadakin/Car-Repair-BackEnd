const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const cors = require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config()
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rohhp7w.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let verifyJWT = (req, res, next)=>{
  // console.log('going to next');
  let authorization = req.headers.authorization;
  if(!authorization){
    return res.send.status(401).send({err: true, mgs: 'unauthorized access'})
  }
  let token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN , (err, decoded)=>{
    if(err){
      return res.send.status(403)({err: true, msg : 'unauthorized access'})
    }
    req.decoded= decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    let servicesData = client.db('CarRepair').collection('services');
    let checkoutData = client.db('CarRepair').collection('checkout');

    app.post('/jwt', (req, res)=>{
      let user = req.body;
      console.log(user);
      let token = jwt.sign(user, process.env.ACCESS_TOKEN,{
        expiresIn: '1h'})
        res.send({token});
      })
    
    app.get('/services', async (req, res)=>{
        let cursor = servicesData.find();
        let result = await cursor.toArray();
        res.send(result)
    })

    app.post('/checkout', async (req, res)=>{
      let checkoutDetails = req.body;
      let result = await checkoutData.insertOne(checkoutDetails);
      res.send(result);
    })

    app.delete('/checkout/:id', async (req, res)=>{
      let id = req.params.id;
      let query = {_id : new ObjectId(id)}
      let result = await checkoutData.deleteOne(query);
      res.send(result)
    })
    app.patch('/checkout/:id', async (req, res)=>{
      let id = req.params.id;
      let query = {_id: new ObjectId(id)}
      let update = req.body
      let updateCheckout = {
        $set:{
          status : update.status
        }
      }
      let result = await checkoutData.updateOne(query, updateCheckout)
      res.send(result)
    })

    app.get('/checkout', verifyJWT, async (req, res)=>{
      // console.log(req.query.email);
      // console.log(req.headers);
      let decoded = req.decoded;
      console.log(decoded);
      let query = {}

      if (req.query?.email){
        query = {email : req.query.email}
      }
      let result = await checkoutData.find(query).toArray();

      res.send(result)

    })

 

    app.get('/services/:id', async (req, res)=>{
        let id = req.params.id;
        let query = {_id : new ObjectId(id)}
        // let options = {
        //     projection: {title: 1, price: 1}
        // }
        let result = await servicesData.findOne(query)
        
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
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})