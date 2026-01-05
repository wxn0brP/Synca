import { ValtheraAutoCreate } from "@wxn0brp/db";
import { createCrdtValthera } from "@wxn0brp/db-crdt";
import FalconFrame from "@wxn0brp/falcon-frame";

if (!process.env.DB_SERVER) {
    console.error("DB_SERVER is not set");
    process.exit(1);
}

const dbDir = process.env.DB_DIR || "data";
const localDB = createCrdtValthera(ValtheraAutoCreate(dbDir));
const remoteDB = createCrdtValthera(ValtheraAutoCreate(process.env.DB_SERVER));
const app = new FalconFrame();

app.static("/", "public", {
    renderData: {
        index: {
            dir: dbDir
        }
    }
});
app.static("dist");

app.get("/todo", async () => {
    return {
        todo: await localDB.find("todo"),
    };
})

app.post("/todo", async ({ body }) => {
    if (!body) return { err: true }
    if (!body.title) return { err: true }

    return {
        todo: await localDB.add("todo", body)
    }
});

app.put("/todo", async ({ body }) => {
    if (!body) return { err: true }
    const _id = body._id;
    delete body._id;
    return {
        todo: await localDB.updateOne("todo", { _id }, body)
    }
});

app.delete("/todo", async ({ body }) => {
    if (!body) return { err: true }
    const _id = body._id;
    return {
        todo: await localDB.removeOne("todo", { _id })
    }
});

app.get("/sync", async () => {
    await localDB.sync(remoteDB, "todo", true);
    remoteDB.sync(localDB, "todo", true);
    return { ok: true };
});

app.l(28934);