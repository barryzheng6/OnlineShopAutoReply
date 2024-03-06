exports = async function(changeEvent) {
  // Get the full document from the change event.
  const doc = changeEvent.fullDocument;
  //const doc = {"_id":"65e41ef9d06d174d66aa2723","date":"2024-03-03T06:55:50.365Z","name":"simba","text":"The chocolate is so sweet!","cakeId":"64294be581bd411f179f2234"};

  // Define the OpenAI API url and key.
  const url_embedding = 'https://api.openai.com/v1/embeddings';
  const url_completion = 'https://api.openai.com/v1/chat/completions';
  // Use the name you gave the value of your API key in the “Values” utility inside of App Services
  const openai_key = context.values.get("openAIKey");
  //const openai_key = "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";

  try {
      console.log(`Processing document with id: ${JSON.stringify(doc)}`);
      

      // Call OpenAI API to get the embeddings.
      let response = await context.http.post({
          url: url_embedding,
           headers: {
              'Authorization': [`Bearer ${openai_key}`],
              'Content-Type': ['application/json']
          },
          body: JSON.stringify({
              input: `${doc.text}`,
              model: "text-embedding-ada-002"
          })
      });

      // Parse the JSON response
      let responseData = EJSON.parse(response.body.text());
      embedding = [];
      // Check the response status.
      if(response.statusCode === 200) {
          console.log("Successfully received embedding.");

          embedding = responseData.data[0].embedding;
          console.log(`comment embedding is : ${JSON.stringify(embedding)}`);
        
          
          
      } else {
          console.log(`Failed to receive embedding. Status code: ${response.body.text()}`);
      }
       // Get the cluster in MongoDB Atlas.
          
          const mongodb = context.services.get('mongodb-atlas');
          const db = mongodb.db('Bakery'); // Replace with your database name.
          const collection = db.collection('cakes'); // Replace with your collection name.
          const vector_result = await collection.aggregate([
            {
              "$vectorSearch": {
                "index": "default",
                "path": "embeddings",
                "queryVector":embedding,
                "numCandidates": 1,
                "limit": 1
              }
            }
          ]).toArray();
          console.log(`current vector_result is : ${JSON.stringify(vector_result)}`);
          
      // Prepare the request string for the OpenAI API.
        const reqString = `Reply to the comments provided here: ${JSON.stringify(doc.text)} and also combine the description here: ${JSON.stringify(vector_result[0].description)}`;
        console.log(`reqString: ${reqString}`);
    
        // Call OpenAI API to get the response.
        
        let resp = await context.http.post({
            url: url_completion,
            headers: {
                'Authorization': [`Bearer ${openai_key}`],
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                temperature: 0,
                messages: [
                    {
                        "role": "system",
                        "content": "you are going to reply the customer's comment nicely with the description I provide"
                    },
                    {
                        "role": "user",
                        "content": reqString
                    }
                ]
            })
        });
    
        // Parse the JSON response
        let replyData = JSON.parse(resp.body.text());
    
        // Check the response status.
        if(resp.statusCode === 200) {
            console.log("Successfully received code.");
            console.log(JSON.stringify(replyData));
    
            const code = replyData.choices[0].message.content;
          
            // Get the required data to be added into the document
           const comments_collection = db.collection('comments'); // Replace with your collection name.
           await comments_collection.updateOne({_id : doc._id}, {$set : {AIReply:code}});
          
    
        } else {
            console.error("Failed to generate filter JSON.");
            console.log(JSON.stringify(replyData));
            return {};
        }

  } catch(err) {
      console.error(err);
  }
};