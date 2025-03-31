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

export const forgeRequest = async (url) => {
  const { requestJira } = await import("@forge/bridge");

  const start = performance.now();
  await requestJira(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const end = performance.now();

  console.log(`Request to ${url} took ${end - start} ms`);

  return end - start;
};

export const connectRequest = (url) =>
  new Promise((resolve, reject) => {
    const start = performance.now();

    window.AP.request(url, {
      contentType: "application/json",
      method: "GET",
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

const parallelPromise = ({ executor, url, count, concurrency }) =>
  BluebirdPromise.map(Array.from({ length: count }), () => executor(url), {
    concurrency,
  });

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
        <label style={labelStyle}>Number of requests</label>
        <input
          type="number"
          defaultValue={requestsCount}
          min={1}
          onChange={(e) => setRequestsCount(Number(e.target.value))}
          style={inputStyle}
        />
      </div>
      <div style={sectionStyle}>
        <label style={labelStyle}>Concurrency</label>
        <input
          type="number"
          defaultValue={concurrency}
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
        <strong>Total execution time:</strong>{" "}
        {(executionTime / 1000).toFixed(2)} s
      </div>
    </div>
  );
};

export default App;
