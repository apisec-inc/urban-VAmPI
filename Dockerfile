FROM ghcr.io/python/cpython:3.11-slim as builder
RUN apk --update add bash nano g++
COPY ./requirements.txt /vampi/requirements.txt
WORKDIR /vampi
RUN pip install -r requirements.txt

# Build fresh container, copying across files & compiled parts
FROM python:3.11-alpine

# Create non-root user in Alpine
RUN addgroup -g 1001 -S vampi && \
    adduser -S vampi -u 1001 -G vampi

COPY . /vampi
WORKDIR /vampi
COPY --from=builder /usr/local/lib /usr/local/lib
COPY --from=builder /usr/local/bin /usr/local/bin

# Change ownership to vampi user
RUN chown -R vampi:vampi /vampi

# Switch to non-root user
USER vampi

# Production environment variables
ENV vulnerable=0
ENV tokentimetolive=60
ENV FLASK_ENV=production

EXPOSE 5000

ENTRYPOINT ["python"]
CMD ["start_production.py"]
