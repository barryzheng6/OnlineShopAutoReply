exports = async function(changeEvent) {
    // Get the full document from the change event.
    const doc = changeEvent.fullDocument;

    // Define the OpenAI API url and key.
    const url = 'https://api.openai.com/v1/embeddings';
    // Use the name you gave the value of your API key in the “Values” utility inside of App Services
    //const openai_key = context.values.get("openAIKey");
    const openai_key = "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";

    try {
        console.log(`Processing document with id: ${JSON.stringify(doc)}`);
        

        // Call OpenAI API to get the embeddings.
        let response = await context.http.post({
            url: url,
             headers: {
                'Authorization': [`Bearer ${openai_key}`],
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                input: `${doc.description}`,
                model: "text-embedding-ada-002"
            })
        });

        // Parse the JSON response
        let responseData = EJSON.parse(response.body.text());

        // Check the response status.
        if(response.statusCode === 200) {
            console.log("Successfully received embedding.");

            const embedding = responseData.data[0].embedding;

            // Get the cluster in MongoDB Atlas.
            const mongodb = context.services.get('mongodb-atlas');
            const db = mongodb.db('Bakery'); // Replace with your database name.
            const collection = db.collection('cakes'); // Replace with your collection name.

            // Update the document in MongoDB.
            const result = await collection.updateOne(
                { _id: doc._id },
                // The name of the new field you’d like to contain your embeddings.
                { $set: { embeddings: embedding }}
            );

            if(result.modifiedCount === 1) {
                console.log("Successfully updated the document.");
                
                
            } else {
                console.log("Failed to update the document.");
            }
        } else {
            console.log(`Failed to receive embedding. Status code: ${response.body.text()}`);
        }

    } catch(err) {
        console.error(err);
    }
};