import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { WritableStream, TransformStream } from 'node:stream/web'
import { setTimeout } from 'node:timers/promises'
import csvtojson from 'csvtojson'


const portIsRunningServer = 3000

createServer( async (request, response) => {

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }

  if(request.method === 'OPTIONS'){
    response.writeHead(204,headers)
    response.end()
    return
  }
  let items = 0;

  const abortController = new AbortController()
  request.once('close', _ => {
    console.log(`connection was closed in the list ${items} viewer`)
    abortController.abort()
  })
   try{
      response.writeHead(200,headers)
      
      await Readable.toWeb(createReadStream('./movies.csv'))
      .pipeThrough(Transform.toWeb(csvtojson()))
      .pipeThrough(new TransformStream({
          transform(chunk,controller){
            const { 
                  Series_Title: titleMovie, 
                  Released_Year: releasedYear,
                  Poster_Link: posterLink,
                  Genre: genreMovie

              } = JSON.parse(Buffer.from(chunk))
            const mappedData = {
              idMovie: items,
              titleMovie,
              releasedYear,
              posterLink,
              genreMovie
            }
            controller.enqueue(JSON.stringify(mappedData).concat('\n'))
          }
      }))
      .pipeTo(new WritableStream({
        async write(chunk){
          await setTimeout(200)
          items++
          response.write(chunk)
        },
        close(){
          response.end()
        }
      }),{
        signal: abortController.signal  
      })

   }catch(error){
      if(!error.message.includes('abort')) throw error
   }
}).listen(portIsRunningServer)
.on('listening', _ => console.log(`server is running ${portIsRunningServer}`))