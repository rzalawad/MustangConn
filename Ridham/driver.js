var nodemailer = require('nodemailer');


function generate_and_send_code(var email)
{
   var code = Math.floor(Math.random() * 888888) + 111111;

   var transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: 'MustangConnectAuthenticate@gmail.com',
      pass: '307AssignmentRocks'
      }
   });

   var mailOptions = {
      from: 'MustangConnectAuthenticate@gmail.com',
      to: email,
      subject: 'MustangConnect Authentication Code',
      text: `Here is your authentication code: ${code}

      We hope you enjoy our site
      Sincerely,
      MustangConnect Team`
   };

   transporter.sendMail(mailOptions, function(error, info){
   if (error) {
      console.log(error);
   } else {
      console.log('Email sent: ' + info.response);
   }
   });
   return code;
}
