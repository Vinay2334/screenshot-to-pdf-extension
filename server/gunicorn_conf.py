from multiprocessing import cpu_count

# Socket Path
bind = 'unix:/home/screenshot-to-pdf-extension/server/gunicorn.sock'

# Worker Options
workers = cpu_count() + 1
worker_class = 'uvicorn.workers.UvicornWorker'

# Logging Options
loglevel = 'debug'
accesslog = '/home/screenshot-to-pdf-extension/server/access_log'
errorlog =  '/home/screenshot-to-pdf-extension/server/error_log'
