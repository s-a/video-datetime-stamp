# video-datetime-stamp
Render a date/time stamp into videos using ffmpeg  
[<img src="https://travis-ci.org/s-a/video-datetime-stamp.png" />](https://travis-ci.org/s-a/video-datetime-stamp "Test state")

Render date time stamps to videos with ffmpeg is annoying.
This node js command line is an easement to do this job.

This command creates an output file at c:/git/video-datetime-stamp/test.stamped.mp4  
```node ./bin/render-stamp.js --file $PWD/video/BigBuckBunny_320x180.mp4```

```The slashes / or \ might depend on the operating system```

This command will stamp every mp4 file in c:\video\  
```node ./bin/render-stamp.js --dir c:\video\```

```node ./bin/render-stamp.js --dir /Users/$USER/testVideoDir```

```node ./bin/render-stamp.js --file /Users/$USER/Documents/video1/BigBuckBunny_320x180.mp4 --dir /Users/$USER/Documents/stamped\ videos```
