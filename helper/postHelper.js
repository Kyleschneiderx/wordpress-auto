require('dotenv').config()
const WPAPI = require('wpapi');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const { Configuration, OpenAIApi } = require('openai');



/// wordpress interaction functions
const postToPFP = async (title, con) =>{

   
    const wp = new WPAPI({ endpoint: process.env.WEBSITEPOST+`/wp-json` });

  try {
    // Authenticate using cookies
    await wp.auth({
      username: process.env.WORDPRESSUSER,
      password: process.env.WORDPRESSPASSWORD
    });

    // Successfully authenticated
    // You can now make authenticated requests
    const response = await wp.posts().create({
      title: title,
      content: con,
      status: 'publish'
    });

    console.log('Post created:', response);

    return response.link
  } catch (error) {
    console.error('Error:', error);
  }



}


const listBlogPost = async () =>{

    const wp = new WPAPI({ endpoint: process.env.WEBSITEPOST+`/wp-json` });

    try {
      // Authenticate using cookies
      await wp.auth({
        username: process.env.WORDPRESSUSER,
        password: process.env.WORDPRESSPASSWORD
      });
  
      // Successfully authenticated
      // You can now make authenticated requests
      const response = await wp.posts().get();
  
      console.log('Post List:', response[0].title.rendered);
  
      return response
    } catch (error) {
      console.error('Error:', error);
    }

}





///GOOGLE SEARCH CONSOLE FUNCTIONS to check search data

const googleSearchData = async (start, end)=>{
    

    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key:process.env.GOOGLE_PRIVATE_KEY ,
        scopes,
    });
  
    const searchconsole = google.searchconsole({
        version: 'v1',
        auth,
    });

    try {
        const res = await searchconsole.sites.list();
        console.log(res.data);
      } catch (err) {
        console.error('Error retrieving list of sites:', err);
    }

    try {
        const startDate = start; // Start date of the date range
        const endDate = end; // End date of the date range
    
        const res = await searchconsole.searchanalytics.query({
          siteUrl: process.env.WEBSITEPOST, // Replace with your website URL
          requestBody: {
            startDate,
            endDate,
            dimensions: ['query'], // Include only the 'query' dimension
            filters: [
              { dimension: 'position', operator: 'gt', expression: '10' }, // Filter for positions greater than 10
              { dimension: 'position', operator: 'lt', expression: '29' }, // Filter for positions less than 21
            ],
            rowLimit: 20, // Maximum number of rows to return (adjust as needed)
          },
        });
    
        console.log(res.data.rows);
        return res.data.rows
      } catch (err) {
        console.error('Error retrieving search analytics data:', err);
    }

}




//// OPEN API Functions

async function gpt3(stext) {
    const api_key = process.env.OPENAI_KEY;

    const configuration = new Configuration({
        organization: process.env.OPENAI_ORG,
        apiKey: api_key,
    });
    const openai = new OpenAIApi(configuration);

    const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: stext }
    ];
    
  
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n:1 
    });

  
    const content = response.data.choices[0].message.content;


    return content;
}


////Processing functions

const breakSection = async (text)=>{

   const sections = text.split(/(?:I\.|II\.|III\.|V\.|VI\.|VII\.|IV\.)/);
    console.log(sections)

    return sections
}


function capitalizeTitle(title) {
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
    
    const words = title.toLowerCase().split(' ');
    const capitalizedWords = words.map((word, index) => {
      if (index === 0 || !smallWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else {
        return word;
      }
    });
    
    return capitalizedWords.join(' ');
}


//CREATING AND POSTING BLOG

const writeBlog = async (topic) =>{

    // `write blog sections\nblog topic: ${query}`
    const outline = await gpt3(`write blog outline\nblog topic: ${topic}`);

    const sections = await breakSection(outline)


    console.log("in write Blog")

    const blog = []

    for(let i = 1; i<sections.length; i++){
        if(sections[i].split('\n')[0] === " Introduction"){
            console.log(' Yes Section 1')
            console.log(sections[i], `This is Section: ${i}`)
            const prompt = await gpt3(`The blog is about ${topic}. Write a introduction section.`)
            blog.push(`${prompt}`)

        }else if(sections[i].split('\n')[0] === " Conclusion"){
            console.log(' Yes Section Conclusion')
            console.log(sections[i], `This is Section: ${i}`)
            const prompt = await gpt3(`The blog is about ${topic}. Write a conclusion of the following text:\n${blog.join("\n")}`)
            blog.push(`<h3>${sections[i].split('\n')[0]}</h3>\n${prompt}`)

        }else{
        console.log(sections[i], `This is Section: ${i}`)
        const prompt = await gpt3(`The blog is about ${topic}. Write a blog section about the following section title:\n${sections[i].split('\n')[0]}`)
        blog.push(`<h3>${sections[i].split('\n')[0]}</h3>\n${prompt}`)
        }
 
    }

    console.log(blog)


    const concatenatedString = blog.join("\n");
    console.log(concatenatedString, "End of Concat ");

    /// process into usable blog
    // const editClean = await gpt3(`Please make into body section of html page \n Text: ${concatenatedString} `)


    // console.log(editClean)


    const post = await postToPFP(capitalizeTitle(topic), concatenatedString)

    console.log(post)

    // await submitPageForIndexing(post)


    return blog

}


module.exports = {writeBlog, listBlogPost, googleSearchData};