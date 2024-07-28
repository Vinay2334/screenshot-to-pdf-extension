from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
import os
import base64
import img2pdf
import json

app = FastAPI()
# pdf_writer = PdfWriter()
pdf_file_path = 'output.pdf'

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    temp_images = []
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            print("image", message)


            if message['type'] == 'image':
                base64_string = message['image']
                if "data:image" in base64_string:
                    base64_string = base64_string.split(",")[1]

                if not os.path.exists("images"):
                    os.makedirs("images")

                image_data = base64.b64decode(base64_string)
                temp_image_path = f"images/temp_image_{len(temp_images)}.png"
                with open(temp_image_path, "wb") as f:
                    f.write(image_data)
                temp_images.append(temp_image_path)
                await websocket.send_text(json.dumps({"status": "image received"}))
            
            elif message['type'] == 'finish':
                # Create a PDF with the images

                with open(pdf_file_path, "wb") as file:
                     file.write(img2pdf.convert([i for i in os.listdir("images/") if i.endswith(
                    ".png")]))

                # Clean up temp images
                for temp_image in temp_images:
                    os.remove(temp_image)
                
                await websocket.send_text(json.dumps({"status": "PDF created", "url": f"http://localhost:8000/{pdf_file_path}"}))
                break
    except Exception as e:
        print(f"Connection closed: {e}")
    finally:
        await websocket.close()

@app.get("/output.pdf")
async def get_pdf():
    return FileResponse(pdf_file_path, media_type='application/pdf', filename='screenshots.pdf')
