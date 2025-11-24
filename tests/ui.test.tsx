import assert from "node:assert";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, Pill, Section, Select, TextArea, TextInput } from "../app/lib/ui.js";

test("Section renders title, description, children, and action", () => {
  const html = renderToStaticMarkup(
    <Section title="Summary" description="Details" action={<div>Action</div>}>
      <p>Body</p>
    </Section>,
  );
  assert(html.includes("Summary"));
  assert(html.includes("Details"));
  assert(html.includes("Body"));
  assert(html.includes("Action"));
});

test("Pill uses tone-specific styling and label", () => {
  const errorHtml = renderToStaticMarkup(<Pill label="Failure" tone="error" />);
  assert(errorHtml.includes("Failure"));
  assert(errorHtml.includes("bg-rose-50"));

  const defaultHtml = renderToStaticMarkup(<Pill label="Info" />);
  assert(defaultHtml.includes("bg-zinc-100"));
});

test("Field pairs label with provided input", () => {
  const html = renderToStaticMarkup(<Field label="Email" input={<input type="text" />} />);
  assert(html.includes("Email"));
  assert(html.includes("input"));
});

test("TextInput and TextArea render their values and placeholders", () => {
  const inputHtml = renderToStaticMarkup(
    <TextInput value="abc" onChange={() => undefined} placeholder="type" />,
  );
  const areaHtml = renderToStaticMarkup(
    <TextArea value="body" onChange={() => undefined} placeholder="write" />,
  );

  assert(inputHtml.includes('value="abc"'));
  assert(inputHtml.includes('placeholder="type"'));
  assert(areaHtml.includes("body"));
  assert(areaHtml.includes("write"));
});

test("Select renders options with labels and values", () => {
  const html = renderToStaticMarkup(
    <Select
      value="b"
      onChange={() => undefined}
      options={[
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta" },
      ]}
    />,
  );
  assert(html.includes("Alpha"));
  assert(html.includes('value="b"'));
});
