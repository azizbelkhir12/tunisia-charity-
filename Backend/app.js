const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const http = require('http'); 
const socketIo = require('socket.io'); // 
const connectDB = require('./config/db');
const routes = require('./routes/index.js');
const donorRoutes = require('./routes/donorRoutes');
const authRoutes = require('./routes/authRoutes');
const feedbackRoutes = require("./routes/feedbackRoutes");
const demanderRoutes = require("./routes/demandeRoutes");
const volunteerRoutes = require('./routes/volunteerRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes'); 
const paymentRoutes = require('./routes/paymentRoutes');
const donationRoutes  = require('./routes/donationRoutes');
const rapportRoutes = require('./routes/rapportRoutes');
const projectRoutes = require('./routes/projectRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const abonnementRoutes = require('./routes/abonnementRoutes');
const translationRoutes = require('./routes/translationRoutes');
const uploads = require('./utils/upload'); 
const app = express();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*'
  }
});


dotenv.config(); 

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

//Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); 

require('./socket/socket')(io);



//database connection 
connectDB();



//Routes
app.use('/', routes);
app.use('/api/donors', donorRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/demande", demanderRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/payment', paymentRoutes); 
app.use('/api/donations', donationRoutes);
app.use('/api/rapport', rapportRoutes); 
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/abonnement', abonnementRoutes);
app.use('/api', translationRoutes);




//server

  const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 