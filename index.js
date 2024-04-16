// https://i.ibb.co/54ZxHMK/Linear.png
// https://i.ibb.co/MGRfQd2/Loom.png
// https://i.ibb.co/zn6yx0t/Notion.png
// https://i.ibb.co/JFDk0Rf/Raycast.png
// https://i.ibb.co/74f8QWY/Spline.png
// https://i.ibb.co/8gkYDhH/Trainline.png
// https://i.ibb.co/k5W6Bjj/google.png
// https://i.ibb.co/3CTC4Wk/accenture.png
// https://i.ibb.co/bQMrdVT/meta.png
// https://i.ibb.co/BqhHsqL/discord.png
const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const handlebars = require("handlebars");
require("dotenv").config();

//Middlewares
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@satyamcluster.yvb6qzy.mongodb.net/?retryWrites=true&w=majority&appName=satyamCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const templateSource = fs.readFileSync("email-template.hbs", "utf8");
const template = handlebars.compile(templateSource);
const data = {
  subject: "Thank you for subscribing",
  greeting: "Greetings from JobPortal",
  message: "Discover your dream job today! Browse our vast database of opportunities tailored just for you.",
};
const htmlContent = template(data);

const sendEmail = (email) => {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });
    const mailConfigs = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: data.subject,
      html: htmlContent
    };
    transporter.sendMail(mailConfigs, (error, info) => {
      if (error) {
        console.log(error.message);
        return reject({ message: "An error has occured" });
      }
      return resolve({ message: "Email sent successfully" });
    });
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //create db
    const db = client.db("jobPortal");
    const jobsCollections = db.collection("jobs");
    //Post A Job
    app.post("/post-job", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      const result = await jobsCollections.insertOne(body);
      if (result.insertedId) {
        return res.status(200).json(result);
      } else {
        return res
          .status(404)
          .json({ message: "Cannot insert! Try Again", status: false });
      }
    });
    //Get all jobs
    app.get("/all-jobs", async (req, res) => {
      const jobs = await jobsCollections.find({}).toArray();
      res.status(200).json(jobs);
    });
    //Get jobs by email
    app.get("/all-jobs/:email", async (req, res) => {
      const { email } = req.params;
      const jobs = await jobsCollections.find({ postedBy: email }).toArray();
      res.status(200).json(jobs);
    });
    //Get job by id
    app.get("/edit-job/:id", async (req, res) => {
      const { id } = req.params;
      const job = await jobsCollections.findOne({ _id: new ObjectId(id) });
      res.status(200).json(job);
    });
    //Update the job
    app.patch("/update-job/:id", async (req, res) => {
      const { id } = req.params;
      const jobData = req.body;
      const result = await jobsCollections.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...jobData } },
        { upsert: true }
      );
      res.status(200).json(result);
    });
    //Delete a Job
    app.delete("/job/:id", async (req, res) => {
      const { id } = req.params;
      const result = await jobsCollections.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Successfully deleted" });
      } else {
        res.status(400).json({ message: "Could not delete" });
      }
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.post("/send-email", (req, res) => {
  const { email } = req.body;
  sendEmail(email)
    .then((response) => res.status(200).json(response.message))
    .catch((error) => res.status(500).json(error.message));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
