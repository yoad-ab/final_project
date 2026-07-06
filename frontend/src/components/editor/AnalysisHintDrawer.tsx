import { BookOpen } from 'lucide-react'

// ── Primitive building blocks ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'var(--color-text-3)', marginBottom: 10, paddingBottom: 6,
        borderBottom: '1px solid var(--color-border)',
      }}>
        {title}
      </h3>
      {children}
    </section>
  )
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--color-text-2)', margin: '0 0 8px', ...style }}>
      {children}
    </p>
  )
}

function C({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      fontFamily: 'var(--font-mono)', fontSize: 11,
      background: 'var(--color-bg-hover)', color: 'var(--color-accent)',
      padding: '1px 5px', borderRadius: 3,
    }}>
      {children}
    </code>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={{
      margin: '6px 0 10px',
      padding: '10px 12px',
      background: 'var(--color-bg-base)',
      border: '1px solid var(--color-border)',
      borderRadius: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      lineHeight: 1.6,
      color: 'var(--color-text-2)',
      overflowX: 'auto',
      whiteSpace: 'pre',
    }}>
      {children}
    </pre>
  )
}

function VarRow({ name, type, desc }: { name: string; type: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <C>{name}</C>
        <span style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{type}</span>
      </div>
      <span style={{ fontSize: 11.5, color: 'var(--color-text-2)', lineHeight: 1.5, paddingLeft: 4 }}>{desc}</span>
    </div>
  )
}

// ── Main drawer ───────────────────────────────────────────────────────────

export function AnalysisHintDrawer() {
  return (
    <div style={{
      width: '30%',
      minWidth: 220,
      maxWidth: 480,
      flexShrink: 0,
      borderLeft: '1px solid var(--color-border)',
      background: 'var(--color-bg-panel)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        flexShrink: 0,
      }}>
        <BookOpen size={13} style={{ color: 'var(--color-text-3)' }} strokeWidth={2} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', letterSpacing: '0.03em' }}>
          Python Reference
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', scrollbarWidth: 'thin' }}>

        <Section title="Execution Context">
          <P>
            Your code runs via Python's <C>exec()</C>. These variables are
            automatically available — no imports needed.
          </P>
          <VarRow
            name="input_dir"
            type="pathlib.Path"
            desc="Directory containing the input data files for this run."
          />
          <VarRow
            name="output_dir"
            type="pathlib.Path"
            desc="Directory where you should write any output files. This is also the working directory shared with the next step in a recipe."
          />
          <VarRow
            name="parent_output"
            type="AnalysisOutput | None"
            desc="The result object from the previous analysis in the recipe. None if this is the first (or only) step."
          />
        </Section>

        <Section title="Returning a Result">
          <P>
            Assign <C>result</C> to return a value. It becomes the{' '}
            <C>returned_object</C> passed to the next step via{' '}
            <C>parent_output</C>. If you don't set it, it defaults to{' '}
            <C>True</C>.
          </P>
          <CodeBlock>{`# Return a scalar
result = 42

# Return a dict of metrics
result = {"accuracy": 0.94, "loss": 0.12}

# Return a DataFrame for the next step
import pandas as pd
df = pd.read_csv(input_dir / "data.csv")
result = df`}</CodeBlock>
        </Section>

        <Section title="Reading Input Files">
          <P>
            Use <C>input_dir</C> like any <C>pathlib.Path</C> to access your
            uploaded data source files.
          </P>
          <CodeBlock>{`import pandas as pd

# Read a CSV
df = pd.read_csv(input_dir / "data.csv")

# Read a JSON file
import json
data = json.loads((input_dir / "config.json").read_text())

# List all files
for f in input_dir.iterdir():
    print(f.name, f.stat().st_size)`}</CodeBlock>
        </Section>

        <Section title="Writing Output Files">
          <P>
            Write anything to <C>output_dir</C>. Files written here are
            preserved with the run and available as inputs to the next recipe
            step.
          </P>
          <CodeBlock>{`import json

# Write a JSON report
(output_dir / "report.json").write_text(
    json.dumps({"score": 0.95, "n": len(df)})
)

# Save a matplotlib figure
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
ax.plot(df["x"], df["y"])
fig.savefig(output_dir / "plot.png", dpi=150)
plt.close(fig)

# Save a processed DataFrame
df.to_csv(output_dir / "processed.csv", index=False)`}</CodeBlock>
        </Section>

        <Section title="Chaining Steps in a Recipe">
          <P>
            When this analysis is not the first step, <C>parent_output</C>{' '}
            holds the previous step's result. Check for <C>None</C> to write
            steps that can run both standalone and mid-recipe.
          </P>
          <CodeBlock>{`import pandas as pd

if parent_output is not None:
    # Receive a DataFrame from the previous step
    df = parent_output.returned_object

    # Inspect the previous analysis
    prev_id = parent_output.analysis.analysis_id
    print(f"Input from: {prev_id}")
else:
    # Fallback: load directly from input_dir
    df = pd.read_csv(input_dir / "data.csv")

# ... process df ...
result = df`}</CodeBlock>
        </Section>

        <Section title="Available Libraries">
          <P>Standard library and all installed packages are importable.</P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['pathlib, os, shutil', 'Filesystem utilities'],
              ['json, csv, re', 'Data parsing'],
              ['numpy', 'Numerical arrays & math'],
              ['pandas', 'DataFrames & tabular data'],
              ['matplotlib, seaborn', 'Plotting (save to output_dir)'],
              ['scipy', 'Signal processing & stats'],
              ['sklearn', 'Machine learning'],
              ['PIL / Pillow', 'Image reading & processing'],
            ].map(([lib, desc]) => (
              <div key={lib} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <C>{lib}</C>
                <span style={{ fontSize: 11, color: 'var(--color-text-3)', lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Quick Examples">
          <P style={{ marginBottom: 4 }}>Summarise a CSV</P>
          <CodeBlock>{`import pandas as pd

df = pd.read_csv(input_dir / "data.csv")
summary = df.describe().to_dict()
(output_dir / "summary.json").write_text(
    __import__("json").dumps(summary, indent=2)
)
result = summary`}</CodeBlock>

          <P>Image histogram</P>
          <CodeBlock>{`from PIL import Image
import numpy as np

img = Image.open(input_dir / "scan.png").convert("L")
hist, _ = np.histogram(np.array(img), bins=256, range=(0, 256))
result = {"histogram": hist.tolist()}`}</CodeBlock>

          <P>Normalise & chain</P>
          <CodeBlock>{`import pandas as pd

df = (parent_output.returned_object
      if parent_output else
      pd.read_csv(input_dir / "data.csv"))

col = "value"
df[col] = (df[col] - df[col].mean()) / df[col].std()
df.to_csv(output_dir / "normalised.csv", index=False)
result = df`}</CodeBlock>
        </Section>

      </div>
    </div>
  )
}
