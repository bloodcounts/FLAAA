FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
COPY custom_fleet/ ./custom_fleet/
COPY start_custom_superlink.py ./

RUN pip install --no-cache-dir -e . && \
    pip install --no-cache-dir grpcio-reflection

# Fleet API, ServerAppIo API, Control API
EXPOSE 9091 9092 9093

CMD ["python", "start_custom_superlink.py"]
