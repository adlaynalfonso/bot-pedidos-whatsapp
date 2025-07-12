const express = require('express');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Verificación de webhook con Meta
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = "especialdelnelson2901";
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recibir mensajes y responder con OpenAI
app.post('/webhook', async (req, res) => {
    const access_token = process.env.ACCESS_TOKEN;
    const phone_number_id = process.env.PHONE_NUMBER_ID;
    const openai_api_key = process.env.OPENAI_API_KEY;
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from;
    const text = message?.text?.body;

    if (from && text) {
      // Consultamos GPT-3.5
      const configuration = new Configuration({
        apiKey: openai_api_key,
      });
      const openai = new OpenAIApi(configuration);

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un bot de pedidos amigable para un restaurante llamado El Especial de Nelson. Tu objetivo es tomar pedidos, preguntar nombre, dirección y teléfono. Sé claro, breve y amable.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      });

      const gpt_response = completion.data.choices[0].message.content;

      // Enviar respuesta por WhatsApp
      await axios.post(`https://graph.facebook.com/v18.0/${phone_number_id}/messages`, {
        messaging_product: 'whatsapp',
        to: from,
        text: { body: gpt_response }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error al procesar:", error.response?.data || error.message);
    res.status(500).send("Error interno");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot corriendo en el puerto ${PORT}`);
});


// ANTES:
const access_token = "EAAQZBSQSxUxUBPO8RIMLwFv12U9...etc";
const phone_number_id = "769915626196229";
const openai_api_key = "sk-proj-...";

// DESPUÉS:
