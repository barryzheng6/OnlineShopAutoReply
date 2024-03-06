exports = async function (changeEvent) {
    const commentDocument = changeEvent.fullDocument;
    const sentiment = await context.functions.execute("analyzeCommentSentiment", commentDocument.text);
    const commentsCollection = context.services.get("mongodb-atlas").db("Bakery").collection("comments");
    await commentsCollection.updateOne(
       {
          _id: commentDocument._id
       }, {
       $set: { sentiment }
       }
    );
    };