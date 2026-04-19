import { ValtheraAutoRemoteCreate } from "@wxn0brp/db";
import { createCrdtValthera } from "@wxn0brp/db-crdt";
import FalconFrame from "@wxn0brp/falcon-frame";

if (!process.env.DB_SERVER) {
    console.error("DB_SERVER is not set");
    process.exit(1);
}

const dbDir = process.env.DB_DIR || "data";
const localDB = createCrdtValthera(ValtheraAutoRemoteCreate(dbDir));
const remoteDB = createCrdtValthera(ValtheraAutoRemoteCreate(process.env.DB_SERVER));
const app = new FalconFrame();

app.static("/", "public", {
    renderData: {
        index: {
            dir: dbDir
        }
    }
});
app.static("dist");

const todos = localDB.c("todo");

app.get("/todo", async () => {
    return {
        todo: await todos.find(),
    };
})

app.post("/todo", async ({ body }) => {
    if (!body) return { err: true }
    if (!body.title) return { err: true }

    return {
        todo: await todos.add(body)
    }
});

app.put("/todo", async ({ body }) => {
    if (!body) return { err: true }
    const _id = body._id;
    delete body._id;
    return {
        todo: await todos.updateOne({ _id }, body)
    }
});

app.delete("/todo", async ({ body }) => {
    if (!body) return { err: true }
    const _id = body._id;
    return {
        todo: await todos.removeOne({ _id })
    }
});

app.get("/sync", async () => {
    await localDB.sync(remoteDB, "todo", true);
    remoteDB.sync(localDB, "todo", true);
    return { ok: true };
});

app.l(28934);
