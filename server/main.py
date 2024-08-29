from fastapi import FastAPI, WebSocket, Query
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from utils import extract_index
import os
import base64
import img2pdf
import json
import shutil
import time

app = FastAPI()
# image_folder = "images/"

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins. Adjust as needed for security.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods. Adjust as needed.
    allow_headers=["*"],  # Allows all headers. Adjust as needed.
)

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id):
    await websocket.accept()
    temp_images = []
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message['type'] == 'keepalive':
                await websocket.send_text(json.dumps({"status": "Socket connection alive"}))

            if message['type'] == 'image':
                base64_string = message['image']
                if "data:image" in base64_string:
                    base64_string = base64_string.split(",")[1]
                    image_folder = f"images_{client_id}"
                    pdf_file_path = f"output_{client_id}.pdf"
                    
                    if not os.path.exists(image_folder):
                        os.makedirs(image_folder)

                    image_data = base64.b64decode(base64_string)
                    temp_image_path = os.path.join(image_folder, f"{len(temp_images)}.png")
                    with open(temp_image_path, "wb") as f:
                        f.write(image_data)
                    temp_images.append(temp_image_path)
                    await websocket.send_text(json.dumps({"status": "image received"}))
                else:
                    await websocket.send_text(json.dumps({"error": "Invalid Image data"}))
            
            elif message['type'] == 'finish':
                # Get the list of image files in the directory
                image_files = [os.path.join(image_folder, i) for i in os.listdir(image_folder) if i.endswith(".png")]

                # Create the PDF
                image_files = sorted(image_files, key=extract_index)
                print(image_files)
                with open(pdf_file_path, "wb") as file:
                    file.write(img2pdf.convert(image_files))

                # Clean up temp folder
                shutil.rmtree(image_folder)
                pdf_url = str(websocket.url_for('get_pdf')) + f"?pdf_file_path={pdf_file_path}"
                print(pdf_url)
                
                await websocket.send_text(json.dumps({"status": "PDF created", "url": pdf_url}))
                break
    
    except Exception as e:
        print(f"Connection closed: {e}")
    finally:
        await websocket.close()

@app.get(f"/getpdf")
async def get_pdf(pdf_file_path = Query(...)):
    response = FileResponse(pdf_file_path, media_type='application/pdf', filename='screenshots.pdf')
    return response

@app.get("/deletepdf/{client_id}")
async def pdf_cleanup(client_id):
    pdf_file_path = f'output_{client_id}.pdf'
    if os.path.exists(pdf_file_path):
        os.remove(pdf_file_path)
        print("output.pdf removed")