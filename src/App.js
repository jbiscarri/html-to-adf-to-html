import "./styles.css";
import { useState } from "react";
import { DOMSerializer, Fragment, Node as PMNode } from "prosemirror-model";
import { defaultSchema } from "@atlaskit/adf-schema/schema-default";
import { JSONTransformer } from "@atlaskit/editor-json-transformer";
import { JIRATransformer } from "@atlaskit/editor-jira-transformer";

import { ConfluenceTransformer } from "@atlaskit/editor-confluence-transformer";
import { confluenceSchema } from "@atlaskit/adf-schema/schema-confluence";
import { BitbucketTransformer } from "@atlaskit/editor-bitbucket-transformer";
import { bitbucketSchema } from "@atlaskit/adf-schema/schema-bitbucket";
import DiffViewer from "./components/DiffViewer";

const adfTransformer = new JSONTransformer();
const jiraTransformer = new JIRATransformer(defaultSchema);
const confluenceTransformer = new ConfluenceTransformer(confluenceSchema);
const bitbucketTransformer = new BitbucketTransformer(bitbucketSchema);

const htmlToBitbucket = (html) => {
  const adfText = bitbucketTransformer.parse(html);
  return adfTransformer.encode(adfText);
};

const htmlToConfluence = (html) => {
  const adfText = confluenceTransformer.parse(html);
  return adfTransformer.encode(adfText);
};

const htmlToJira = (html) => {
  const adfText = jiraTransformer.parse(html);
  return adfTransformer.encode(adfText);
};

// ADF to HTML code was migrated from here
// https://sourcegraph-frontend.internal.shared-prod.us-west-2.kitt-inf.net/bitbucket.org/atlassian/content-platform-api/-/blob/src/utils/rtf-adf.ts?L135:14

/**
 *   Generates a ProseMirror Fragment from a node using the ADF schema
 *   @param {PMNode} node ProseMirror node to fragment-ize
 *   @returns {Fragment}
 */
export const nodeToFragment = (node) => {
  return Fragment.fromJSON(defaultSchema, node);
};

/**
 *   Cleans the HTML for ADF processing. There are some HTML Elements that ADF doesn't recognize
 *   @param {string} html the raw HTML to transform
 *   @returns {string}
 */
export const replaceHtmlTags = (html) => {
  // this constant exists in case
  // we ever need to add more
  const tags = [
    { from: /<em>/g, to: "<i>" },
    { from: /<\/em>/g, to: "</i>" },
    // ensure break tags are self-closing
    { from: /<br>/g, to: "<br />" }
  ];
  for (const tag of tags) {
    html = html.replace(tag.from, tag.to);
  }
  return html;
};

/**
 *   Renders ADF as an html string
 *   @param {Document} rawJson the ADF entity to transform
 *   @returns {string}
 */
export const adfToHtml = (rawJson) => {
  if (rawJson == null) return "";

  const jsdoc = window.document;
  const el = jsdoc.createElement("div");
  console.warn(rawJson);
  const node = JSON.parse(JSON.stringify(rawJson)).content;
  const fragment = nodeToFragment(node);
  el.append(
    DOMSerializer.fromSchema(defaultSchema).serializeFragment(fragment, {
      document: jsdoc
    })
  );
  const c = replaceHtmlTags(el.innerHTML);
  console.log(c);
  return c;
};

export default function App() {
  const [plaintextValue, setPlaintextValue] = useState(
    "<strong>qwe</strong>\ntext"
  );
  const [bbOutput, setBbOutput] = useState("");
  const [bbAdf, setBbAdf] = useState(null);
  const [bbHtml, setBbHtml] = useState("");

  const [cfOutput, setCfOutput] = useState("");
  const [cfAdf, setCfAdf] = useState(null);
  const [cfHtml, setCfHtml] = useState("");

  const [jiraOutput, setJiraOutput] = useState("");
  const [jiraAdf, setJiraAdf] = useState(null);
  const [jiraHtml, setJiraHtml] = useState("");

  const handlePlaintextInput = (e) => {
    setPlaintextValue(e.target.value);
    updateOutputs(e.target.value);
  };

  const updateOutputs = (text) => {
    const bbAdf = htmlToBitbucket(text);
    setBbOutput(JSON.stringify(bbAdf, null, 2));
    setBbAdf(bbAdf);
    setBbHtml(adfToHtml(bbAdf));

    const cfAdf = htmlToConfluence(text);
    setCfOutput(JSON.stringify(cfAdf, null, 2));
    setCfAdf(cfAdf);
    setCfHtml(adfToHtml(cfAdf));

    const jiraAdf = htmlToJira(text);
    setJiraOutput(JSON.stringify(jiraAdf, null, 2));
    setJiraAdf(jiraAdf);
    setJiraHtml(adfToHtml(jiraAdf));
  };

  return (
    <div className="App">
      <div className="sticky_plaintext">
        <h2>Plaintext</h2>
        <label style={{ color: "blue", weight: 900 }}>plaintext input</label>
        <textarea
          value={plaintextValue}
          onChange={handlePlaintextInput}
          rows={5}
        />
        <label>plaintext html render:</label>
        <div
          className="render_area"
          dangerouslySetInnerHTML={{ __html: plaintextValue }}
        />
      </div>
      <br />

      <h2 className="sticky_header">BitBucket (BB)</h2>
      <label>readonly ADF output BitBucket (BB)</label>
      <textarea readOnly value={bbOutput} rows={10} />
      <label>
        comparing <span style={{ color: "red" }}>BB</span> to{" "}
        <span style={{ color: "green" }}>CF</span> by ADF:
      </label>
      <div className="render_area">
        <DiffViewer one={bbOutput} another={cfOutput} />
      </div>
      <label>ADF BB html render:</label>
      <div
        className="render_area"
        dangerouslySetInnerHTML={{ __html: jiraHtml }}
      />
      <label>readonly ADF BB html output:</label>
      <textarea readOnly value={jiraHtml} rows={10} />

      <h2 className="sticky_header">Confluence (CF)</h2>
      <label>readonly ADF output Confluence (CF)</label>
      <textarea readOnly value={cfOutput} rows={10} />
      <label>
        comparing <span style={{ color: "red" }}>CF</span> to{" "}
        <span style={{ color: "green" }}>Jira</span> by ADF:
      </label>
      <div className="render_area">
        <DiffViewer one={cfOutput} another={jiraOutput} />
      </div>
      <label>ADF Confluence (CF) html render:</label>
      <div
        className="render_area"
        dangerouslySetInnerHTML={{ __html: cfHtml }}
      />
      <label>readonly ADF Confluence (CF) html output:</label>
      <textarea readOnly value={cfHtml} rows={10} />

      <h2 className="sticky_header">Jira</h2>
      <label>readonly ADF output Jira</label>
      <textarea readOnly value={jiraOutput} rows={10} />
      <label>ADF Jira html render:</label>
      <div
        className="render_area"
        dangerouslySetInnerHTML={{ __html: jiraHtml }}
      />
      <label>readonly ADF Jira html output:</label>
      <textarea readOnly value={jiraHtml} rows={10} />
    </div>
  );
}
