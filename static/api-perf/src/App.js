import React, { useState } from "react";
import { Promise as BluebirdPromise } from "bluebird";

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
};

const containerStyle = {
  fontFamily: "Arial, sans-serif",
  padding: "20px",
  maxWidth: "600px",
  margin: "0 auto",
};

const sectionStyle = {
  marginBottom: "20px",
};

export const forgeRequest = async ({ url, method, body }) => {
  const { requestJira } = await import("@forge/bridge");

  const start = performance.now();
  await requestJira(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const end = performance.now();

  console.log(`Request to ${url} took ${end - start} ms`);

  return end - start;
};

export const connectRequest = ({ url, method, body }) =>
  new Promise((resolve, reject) => {
    const start = performance.now();

    window.AP.request(url, {
      contentType: "application/json",
      type: method,
      data: body ? JSON.stringify(body) : undefined,
      success: () => {
        const end = performance.now();

        console.log(`Request to ${url} took ${end - start} ms`);

        resolve(end - start);
      },
      reject: (error) => {
        reject(error);
      },
    });
  });

const parallelPromise = ({ executor, url, method, body, count, concurrency }) =>
  BluebirdPromise.map(
    Array.from({ length: count }),
    () => executor({ url, method, body }),
    { concurrency }
  );

const initAlljs = () => {
  const script = document.createElement("script");
  script.src = "https://connect-cdn.atl-paas.net/all.js";
  script.setAttribute("data-options", "sizeToParent:true");
  document.body.appendChild(script);
};

if (!process.env.REACT_APP_FORGE) {
  initAlljs();
}

const App = () => {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [requestsCount, setRequestsCount] = useState(1);
  const [executionTime, setExecutionTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [concurrency, setConcurrency] = useState(5);

  const requestHandler = process.env.REACT_APP_FORGE
    ? forgeRequest
    : connectRequest;

  const handleClick = async () => {
    setExecutionTime(0);
    setResponseTimes([]);
    setIsExecuting(true);

    window.performance.clearMarks();
    window.performance.clearMeasures();

    window.performance.mark("start");

    const times = await parallelPromise({
      executor: requestHandler,
      url,
      method,
      body: body ? JSON.parse(body) : undefined,
      count: requestsCount,
      concurrency,
    });

    window.performance.mark("end");
    window.performance.measure("total", "start", "end");
    const total = window.performance.getEntriesByName("total");

    setResponseTimes(times);
    setExecutionTime(total[0].duration);
    setIsExecuting(false);
  };

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          {process.env.REACT_APP_FORGE ? `requestJira()` : `AP.request()`}{" "}
          performance test
        </h1>
        <label style={labelStyle}>
          Get URL path, e.g. <i>/rest/api/3/myself</i>
        </label>
        <input
          type="text"
          onChange={(e) => setUrl(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={sectionStyle}>
        <label style={labelStyle}>HTTP Method</label>
        <select
          onChange={(e) => setMethod(e.target.value)}
          style={inputStyle}
          value={method}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div style={sectionStyle}>
        <label style={labelStyle}>Request Body (JSON)</label>
        <textarea
          onChange={(e) => setBody(e.target.value)}
          style={{ ...inputStyle, height: "100px" }}
          placeholder='{"key": "value"}'
        />
      </div>
      <div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Number of requests</label>
          <input
            type="number"
            value={requestsCount}
            min={1}
            onChange={(e) => setRequestsCount(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Concurrency</label>
          <input
            type="number"
            value={concurrency}
            min={1}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <button onClick={handleClick}>Execute</button>
        {isExecuting && (
          <div style={{ marginTop: "20px", color: "#007bff" }}>
            Running parallel requests...
          </div>
        )}
        <div style={{ marginTop: "20px" }}>
          <strong>Response times (ms):</strong>
          <ul>
            {responseTimes.map((time, index) => (
              <li key={index}>
                Request {index + 1}: {time.toFixed(2)} ms
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: "20px" }}>
          <strong>Average response time:</strong>{" "}
          {responseTimes.length > 0
            ? (
                responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
              ).toFixed(2)
            : 0}{" "}
          ms
        </div>
        <div style={{ marginTop: "20px" }}>
          <strong>Total execution time:</strong>{" "}
          {(executionTime / 1000).toFixed(2)} s
        </div>
      </div>
    </div>
  );
};

export default App;
