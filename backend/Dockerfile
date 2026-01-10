FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if any (none needed for standard flask/sqlite usually)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment variables
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 5010

# Use gunicorn with 2 workers for low-perf servers (RAM conservation)
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5010", "run:app"]
