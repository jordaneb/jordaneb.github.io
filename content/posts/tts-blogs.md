---
title: "I'll read my blog posts for you (voice clones using AI)"
date: "2025-05-01"
description: "An experiment adding text-to-speech narration to posts using my own voice."
tags: ["ai", "tts", "personal-site"]
audioUrl: "https://jordaneb.lon1.cdn.digitaloceanspaces.com/jordaneb/pages/tts-blogs/tts.mp3"
---

I recently relaunched my personal website with the goal of writing down personal achievements, experiments or other interesting stuff I have done or encountered. I've tried this a couple of times before but never really committed to it. This time I'm aiming to really take it more seriously. The posts on the site before this one were old ones to make the site feel less empty and give me a canvas to work from.

Anyway, one experimental project I wanted to try was adding natural text‑to‑speech narration to my posts — in my own voice.

Partly because it sounded fun and partly to prove the viability of it. I’ve been experimenting with AI tools lately, and the pace of new ones coming out is kind of wild. I’d seen ElevenLabs used to generate fast voice clones of your own voice. The idea of having a spoken version of my blog — read in a voice that sounds eerily like mine — was interesting, and the potential real‑world use‑cases get me pretty excited.

Some real world examples:

- **Accessibility**: audio can help readers with visual impairments or reading difficulties engage with content more easily. This implementation isn’t accessibility focused, but it’s now a business consideration too with things like The European Accessibility Act 2025.
- **Brand cohesion in digital media**: in a commercial setting for media (videos, tutorials, podcasts), you can use a single representative voice while freeing those people up for other work.

## Making the Voice Clone

Cloning my voice was surprisingly straightforward. I signed up for an ElevenLabs account and recorded audio samples through their web interface. They prompt you to read a handful of predefined snippets — I spent about ten minutes going through them. A couple of hours later the voice is ready and you can start generating TTS.

They recommend providing more data for higher‑quality results, but for a fun experiment I wasn’t too worried about perfection. The resulting voice isn’t flawless, but it’s close enough to be recognizable — and a bit uncanny in a fun way.

## How it works (in broad strokes)

Here’s how I did it:

### 1. Take the raw blog post text

This website was a simple Django app at the time, and blog posts were stored as plain Markdown files on disk. Each post had a small bit of metadata in a Python config dictionary.

```python
from project.pages.config import PAGES
```

### 2. Send it to OpenAI for TTS‑friendly transformation

I call OpenAI to make the text more suitable for audio. It’s especially important for handling code blocks, which don’t translate well to speech.

Important instruction:

> **ONLY RESPOND WITH THE TEXT TO BE SPOKEN. DO NOT INCLUDE ANY OTHER TEXT AS THE RESPONSE WILL BE PASSED DIRECTLY INTO A TEXT TO SPEECH SYSTEM**

Without this, you’ll get markdown wrappers or meta‑commentary that would be read aloud.

```python
def transform_text_for_tts(self, text):
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.responses.create(
        model=settings.GPT_MODEL_NAME,
        instructions=(
            "Transform the following article content to be more suitable for text-to-speech narration. "
            "When encountering code blocks, provide a concise, high-level explanation of what the code does "
            "instead of reading it verbatim. Preserve the key points and ideas while making the text more naturally spoken with minimal changes. "
            "ONLY RESPOND WITH THE TEXT TO BE SPOKEN. DO NOT INCLUDE ANY OTHER TEXT AS THE RESPONSE WILL BE PASSED DIRECTLY INTO A TEXT TO SPEECH SYSTEM"
        ),
        input=text
    )

    return response.output_text
```

### 3. Send the revised text to ElevenLabs

The revised text goes to ElevenLabs using their Python client, returning a stream of MP3 audio.

```python
def generate_audio(self, tts_text):
    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)

    audio = client.text_to_speech.convert(
        text=tts_text,
        voice_id=settings.ELEVENLABS_VOICE_ID,
        model_id=settings.ELEVENLABS_MODEL_ID,
        output_format=settings.ELEVENLABS_OUTPUT_FORMAT,
    )

    return audio
```

### 4. Upload the MP3 to a CDN

I use DigitalOcean Spaces via `django-storages`.

```python
def upload_tts_audio(self, slug, audio_file):
    file_path = os.path.join(settings.TRANSCRIPT_DIR, slug, settings.SPOKEN_TRACK_FILENAME)
    default_storage.save(file_path, ContentFile(b"".join(audio_file)))
    s3_client = get_s3_client()
    s3_client.put_object_acl(
        ACL='public-read',
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=file_path
    )
    return file_path

def upload_tts_text(self, slug, tts_text):
    file_path = os.path.join(settings.TRANSCRIPT_DIR, slug, settings.TRANSCRIPT_TEXT_FILENAME)
    default_storage.save(file_path, ContentFile(tts_text))
    s3_client = boto3.client('s3')
    return file_path
```

### 5. Embed it in the blog post

Once hosted, a standard `<audio>` element is enough:

```html
<audio controls>
  <source src="/tts/my-post-title.mp3" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>
```

That’s it. The main effort for production‑ready quality is better voice‑clone training data and tighter text‑to‑speech prompts.

## Relevant settings

Settings I was using in `settings.py`:

```python
# OpenAI settings
OPENAI_API_KEY = env('OPENAI_API_KEY', default=None)
GPT_TEMPERATURE = env('GPT_TEMPERATURE', default=0.7)
GPT_MODEL_NAME = env('GPT_MODEL_NAME', default='gpt-4.1-nano')
GPT_MAX_TOKENS = env('GPT_MAX_TOKENS', default=1500)

# ElevenLabs settings
ELEVENLABS_API_KEY = env('ELEVENLABS_API_KEY', default=None)
ELEVENLABS_VOICE_ID = env('ELEVENLABS_VOICE_ID', default=None)
ELEVENLABS_MODEL_ID = env('ELEVENLABS_MODEL_ID', default='eleven_multilingual_v2')
ELEVENLABS_OUTPUT_FORMAT = env('ELEVENLABS_OUTPUT_FORMAT', default='mp3_44100_128')

# File and transcript settings
TRANSCRIPT_DIR = "pages"
SPOKEN_TRACK_FILENAME = "tts.mp3"
TRANSCRIPT_TEXT_FILENAME = "tts.txt"

# S3 / django-storages configuration
S3_BUCKET_NAME = env('S3_BUCKET_NAME', default=None)
S3_ENDPOINT_URL = env('S3_ENDPOINT_URL', default=None)
CDN_URL = env('CDN_URL', default=None)
S3_ACCESS_KEY_ID = env('S3_ACCESS_KEY_ID', default=None)
S3_SECRET_ACCESS_KEY = env('S3_SECRET_ACCESS_KEY', default=None)
ENABLE_S3_FOR_STORAGE = env('ENABLE_S3_FOR_STORAGE', default=None)
```

