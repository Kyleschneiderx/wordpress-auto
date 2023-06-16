const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
var moment = require('moment');

const {
    writeBlog, listBlogPost, googleSearchData
} = require('./helper/postHelper')

const cron = require('node-cron');

cron.schedule('0 9,12,18 * * *', async () => {

    const currentDate = moment();
    const pastDate = moment().subtract(90, 'days');

    console.log(pastDate.format('YYYY-MM-DD'));

    // format date YYYY-MM-DD
    const googleKeywords = await googleSearchData(pastDate.format('YYYY-MM-DD'),currentDate.format('YYYY-MM-DD'))

    const blogs = await listBlogPost()

    // console.log(googleKeywords[0].keys[0])

    // console.log(blogs[0].title.rendered.toLowerCase())

    const publishList = []

    for(let i = 0; i < googleKeywords.length; i++ ){
        for(let k = 0; k < blogs.length; k++){
            console.log(googleKeywords[i].keys[0], blogs[k].title.rendered.toLowerCase())
            if(googleKeywords[i].keys[0] !==  blogs[k].title.rendered.toLowerCase()){
                publishList.push(googleKeywords[i].keys[0])
            }
        }

        
    }

    console.log(publishList)

    // for(let j = 0; j< publishList.length; j++){
    //     console.log(publishList[j])
    //     await writeBlog(publishList[j])

    // }





})





app.use(cors());


app.use(express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf
    }
}));





// define the first route
app.get("/", function (req, res) {
  res.send("<h1>Welcome to Lake City PT billing please call (208) 966-4176 if you have any questions</h1>")
})







app.use(express.static('client/build'));

if(process.env.NODE_ENV === 'production'){
    const path = require('path');
    app.get('/*',(req,res)=>{
        res.sendFile(path.resolve(__dirname,'../client','build','index.html'))
    })
}





const port = process.env.PORT || 3001

app.listen(port, () =>{
    console.log('SERVER RUNNING', port)
})