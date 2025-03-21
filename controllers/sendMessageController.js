require("dotenv").config();
const axios = require("axios");


const twilio = require("twilio");
const DocumentYearData = require("../models/DocumentYearData");
const User = require("../models/User");
const Document = require("../models/Document");
const { default: mongoose } = require("mongoose");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken, {
  httpClient: new twilio.Twilio(),
});

const sendMessage = async (req, res) => {
  try {
    const { to, type, userId } = req.body;

    console.log("Received request:", req.body);

    const user = await User.findOne({ whatsappNumber: to });


    if (!user) {
      console.log("User not found:", to);
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    console.log("User found:", user);

    const document = await Document.findOne({ userId: user._id, type }).sort({
      createdAt: -1,
    });

    if (!document || !document.fileUrl) {
      console.log("No document found for type:", type);
      return res
        .status(404)
        .json({ success: false, msg: "No document found for this type" });
    }

    let cloudinaryUrl = document.fileUrl;

    let pdfUrl = cloudinaryUrl;

    const formattedPdfUrl = pdfUrl.startsWith("http")
      ? pdfUrl
      : `https:${pdfUrl}`;

    console.log("Final Media URL:", formattedPdfUrl);

    // Debug: Check if Cloudinary file is accessible
    const https = require("https");
    https
      .get(formattedPdfUrl, (response) => {
        if (response.statusCode === 200) {
          console.log("Cloudinary file is accessible");
        } else {
          console.log(
            "Cloudinary file is not accessible. Status code:",
            response.statusCode
          );
          return res
            .status(500)
            .json({ success: false, msg: "Cloudinary file is not accessible" });
        }
      })
      .on("error", (e) => {
        console.error("Error checking Cloudinary file:", e);
        return res
          .status(500)
          .json({ success: false, msg: "Error accessing Cloudinary file" });
      });

    // Send the message with media URL
    const message = await client.messages.create({
      body: `Here is your requested ${type} document.`,
      from: "whatsapp:+14155238886", // Make sure this is a Twilio WhatsApp number
      to: `whatsapp:${to}`,
      mediaUrl: [formattedPdfUrl], // Media URL must be an array
    });

    console.log("Message sent successfully:", message.sid);
    res
      .status(200)
      .json({ success: true, msg: "Message sent", sid: message.sid });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};




const receiveMessage = async (req, res) => {
  try {
    // Validate request body
    if (!req.body || !req.body.Body || !req.body.From) {
      console.log("⚠️ Invalid message format received.");
      return res.status(400).send("Invalid message format.");
    }

    const { Body, From } = req.body;
    console.log(`📩 Incoming Message from ${From}: ${Body}`);

    // Format the WhatsApp number
    const formattedNumber = From.replace("whatsapp:", "").replace("+91", "").trim();

    // Find the user
    const user = await User.findOne({ whatsappNumber: formattedNumber });
    if (!user) {
      console.log("❌ User not found.");
      await sendMessageToUser(From, "👋 Hello! You are not registered in our system. Kindly reach out to Admin for further assistance.");
      return res.status(400).send("User not found.");
    }

    console.log("🔍 User from DB:", user);
    const userMessage = Body.trim().toLowerCase();
    console.log(`📩 User Message: ${userMessage}`);

    // Handle welcome message for new users
    if (user.lastInteraction === "0" && isNaN(userMessage)) {
      await sendMessageToUser(From, `👋 Welcome to ${user?.username || "User"}! How can we assist you today?`);
      return await handleDocumentSelection(user, userMessage, From, formattedNumber, res);
    }

    // Handle year selection
    if (!isNaN(userMessage) && user.lastInteraction !== "0") {
      await sendMessageToUser(From, "🔍 Your data is being searched, please wait...");
      return await handleYearSelection(user, userMessage, From, formattedNumber, res);
    }

    // Handle invalid input during document selection
    if (user.lastInteraction !== "0") {
      await sendMessageToUser(From, "⚠️ Please select a proper valid number from the below document list.");
      return await handleDocumentSelection(user, "showList", From, formattedNumber, res);
    }

    // Default document selection flow
    await sendMessageToUser(From, "🔍 Your data is being searched, please wait...");
    return await handleDocumentSelection(user, userMessage, From, formattedNumber, res);
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    await sendMessageToUser(req.body?.From || "", "🚨 Technical issue occurred. Please try again later.");
    await sendMessageToUser(req.body?.From || "", "🔁 If the issue persists, please reach out to Admin.");
    return res.status(500).json({ success: false, msg: "An error occurred." });
  }
};

const handleYearSelection = async (user, userMessage, From, formattedNumber, res) => {
  try {
    const documentId = user.lastInteraction;
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      console.error(`❌ Invalid documentId: ${documentId}`);
      await sendMessageToUser(From, "⚠️ Error: Invalid document selection.");
      return res.status(400).send("Invalid document selection.");
    }

    const yearwiseData = await DocumentYearData.find({ documentId });
    if (!yearwiseData.length) {
      await sendMessageToUser(From, "❌ No year data found for this document.");
      return res.status(400).send("No year data found.");
    }

    if (!isNaN(userMessage)) {
      const selectedIndex = parseInt(userMessage, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < yearwiseData.length) {
        const selectedYear = yearwiseData[selectedIndex];
        await sendMessageToUser(From, `📜 You selected year: ${selectedYear.yearRange}`);

        // Send the PDF for the selected year
        await sendDirectDocument(From, documentId);
        return res.status(200).send("Year selection processed.");
      } else {
        await sendMessageToUser(From, "⚠️ Invalid year selection. Please try again.");
        return await handleDocumentSelection(user, "showList", From, formattedNumber, res); // Re-send document list
      }
    } else {
      await sendMessageToUser(From, "⚠️ Please select a valid number from the year list.");
      return await handleDocumentSelection(user, "showList", From, formattedNumber, res); // Re-send document list
    }
  } catch (error) {
    console.error("❌ Error in year selection:", error);
    await sendMessageToUser(From, "🚨 Technical issue. Try again later.");
    return res.status(500).send("Error processing year selection.");
  }
};

const handleDocumentSelection = async (user, userMessage, From, formattedNumber, res) => {
  try {
    const documents = await Document.find({ userId: user._id });
    if (!documents.length) {
      await sendMessageToUser(From, "❌ No documents found. Contact Admin.");
      return res.status(400).send("No documents found.");
    }

    const docMap = documents.reduce((acc, doc, index) => {
      acc[doc.name.toLowerCase()] = { id: doc._id, name: doc.name };
      acc[index + 1] = { id: doc._id, name: doc.name };
      return acc;
    }, {});

    if (!isNaN(userMessage) && docMap[parseInt(userMessage, 10)]) {
      const document = docMap[parseInt(userMessage, 10)];
      if (!mongoose.Types.ObjectId.isValid(document.id)) {
        console.error(`❌ Invalid documentId: ${document.id}`);
        await sendMessageToUser(From, "⚠️ Error: Invalid document selection.");
        return res.status(400).send("Invalid document selection.");
      }

      const yearwiseData = await DocumentYearData.find({ documentId: document.id });
      if (yearwiseData.length > 0) {
        const yearOptions = yearwiseData.map((data, index) => `${index + 1}️⃣ ${data.yearRange}`).join("\n");
        await sendMessageToUser(From, `📅 Select a year:\n${yearOptions}`);
        await User.updateOne({ whatsappNumber: formattedNumber }, { lastInteraction: document.id });
      } else {
        await sendDirectDocument(From, document.id);
      }
      return res.status(200).send("Document processed.");
    }

    // Re-send document list for invalid input
    const docList = documents.map((doc, index) => `${index + 1}️⃣ ${doc.name}`).join("\n");
    await sendMessageToUser(From, `📄 Select a document:\n${docList}`);
    await User.updateOne({ whatsappNumber: formattedNumber }, { lastInteraction: "0" });
    return res.status(200).send("Document list sent.");
  } catch (error) {
    console.error("❌ Error in document selection:", error);
    await sendMessageToUser(From, "🚨 Technical issue. Try again later.");
    return res.status(500).send("Error processing document selection.");
  }
};

const sendDirectDocument = async (to, documentId) => {
  try {
    const document = await Document.findOne({ _id: documentId });
    if (!document) {
      return await sendMessageToUser(to, "❌ Document not found. Please contact Admin.");
    }

    const fileUrl = getFileUrl(document.fileUrl);
    if (!(await isValidFileUrl(fileUrl))) {
      return await sendMessageToUser(to, "❌ Error: Document is unavailable. Please contact Admin.");
    }

    console.log(`✅ Sending ${document.name} document to ${to}`);
    await sendMediaMessage(to, fileUrl, `${document.name} Document.pdf`);
  } catch (error) {
    console.error("❌ Error in sendDirectDocument:", error);
    await sendMessageToUser(to, "🚨 Technical issue. Try again later.");
  }
};

const getFileUrl = (filePath) => {
  const baseUrl = process.env.FILE_BASE_URL || "http://localhost:5000/uploads/";
  return filePath.startsWith("http") ? filePath : `${baseUrl}${filePath}`;
};

const sendMessageToUser = async (to, message) => {
  if (!to) return;
  try {
    await client.messages.create({ from: process.env.TWILIO_WHATSAPP_NUMBER, to, body: message });
    console.log(`📩 Sent message to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending message to ${to}:`, error);
  }
};

const sendMediaMessage = async (to, mediaUrl, fileName) => {
  try {
    if (!(await isValidFileUrl(mediaUrl))) {
      throw new Error(`Invalid media URL: ${mediaUrl}`);
    }
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      // mediaUrl: [mediaUrl], // Use the actual media URL
      mediaUrl: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
      body: `📄 Here is your requested document: ${fileName}`,
    });
    console.log(`📩 Sent document to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending document to ${to}:`, error);
  }
};

const isValidFileUrl = async (url) => {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
};










module.exports = {
  sendMessage,
  receiveMessage,
};
