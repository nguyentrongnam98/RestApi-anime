const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { query } = require('express');
const app = express()
const url = 'https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki'
// setup
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({
    limit:'50mb',
    extended:true,
    parameterLimit:50000
}))
app.use(cors())
dotenv.config()

app.get('/v1',(req,resp) => {
    const thumbnails = [];
    const limit  = Number(req.query.limit)
    try {
        axios(url).then((res) => {
            const html = res.data;
            const $ = cheerio.load(html)
            $(".portal",html).each(function(){
                const name = $(this).find("a").attr("title")
                const url = $(this).find("a").attr('href')
                const image = $(this).find("a > img").attr("data-src")
                thumbnails.push({
                    name,
                    url:"http://localhost:3000/v1" + url.split('/wiki')[1],
                    image
                })
            })
            
            if (limit && limit > 0) {
                resp.status(200).json(thumbnails.slice(0,limit))
            } else {
                resp.status(200).json(thumbnails)
            }
        })
    } catch (error) {
        resp.status(500).json(error)
    }
})

app.get('/v1/:character', (req,resp) => {
  try {
      axios(`https://kimetsu-no-yaiba.fandom.com/wiki/${req.params.character}`).then((res) => {
          const html = res.data;
          const $ = cheerio.load(html);
          const titles = [];
          const details = [];
          const characterObj = {};
          const characters = [];
          const gallerys = [];
          $(".wikia-gallery-item",html).each(function(){
            const gallery = $(this).find('a > img').attr('data-src')
            gallerys.push(gallery)
          })
          $('aside',html).each(function(){
              const image = $(this).find('img').attr('src')
             $(this).find("section > div > h3").each(function(){
               titles.push($(this).text())
             });
             $(this).find('section > div > div').each(function(){
                 details.push($(this).text())
             })
             if (image !== undefined) {
                for(let i = 0 ; i < titles.length ; i++) {
                    characterObj[titles[i].toLowerCase()] = details[i];
                }
                characters.push({
                    ...characterObj,
                    image,
                    gallerys,
                    name:req.params.character.replace('_','')
                })
             }
          })
          resp.status(200).json(characters)
      })
  } catch (error) {
      resp.status(500).json(error)
  }
})

app.listen(process.env.PORT , () => {
    console.log('server is running')
})