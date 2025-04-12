#!/usr/bin/env bash
gunicorn 'api.app:app' --config gunicorn_config.py