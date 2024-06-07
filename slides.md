exemple diapo avec du code runnable

```python {monaco-run} {autorun:false,runnerOptions:['prefect'] }
import time
for i in range(10):
    print(i)
    time.sleep(1)

raise ValueError("This is an error")
```