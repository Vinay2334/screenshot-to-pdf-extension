from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse, PlainTextResponse
import os
import base64
import img2pdf
import json
import shutil

app = FastAPI()
pdf_file_path = 'output.pdf'
image_folder = "images/"

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
                temp_image_path = os.path.join(image_folder, f"temp_images_{len(temp_images)}.png")
                # temp_image_path = f"images/temp_image_{len(temp_images)}.png"
                with open(temp_image_path, "wb") as f:
                    f.write(image_data)
                temp_images.append(temp_image_path)
                await websocket.send_text(json.dumps({"status": "image received"}))
            
            elif message['type'] == 'finish':
                # Get the list of image files in the directory
                image_files = [os.path.join(image_folder, i) for i in os.listdir(image_folder) if i.endswith(".png")]

                # Create the PDF
                with open(pdf_file_path, "wb") as file:
                    file.write(img2pdf.convert(image_files))

                # Clean up temp folder
                shutil.rmtree(image_folder)
                await websocket.send_text(json.dumps({"status": "PDF created", "url": f"http://127.0.0.1:8000/{pdf_file_path}"}))
                break
    except Exception as e:
        print(f"Connection closed: {e}")
    finally:
        await websocket.close()

@app.get("/output.pdf")
async def get_pdf():
    return FileResponse(pdf_file_path, media_type='application/pdf', filename='screenshots.pdf')