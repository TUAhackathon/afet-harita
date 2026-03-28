from fastapi import FastAPI

app = FastAPI(title="Afet Harita API")

@app.get("/")
def read_root():
    return {"message": "Welcome to Afet Harita API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
