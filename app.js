require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const lodash = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL);

const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<--- Hit this to delete an item."
});

const defualtItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", async function (req, res) {
    const lists = await List.find();
    
    Item.find({}, function (err, itemsInDb) {
        if (err) {
            console.log(err);
        }
        else if (itemsInDb.length === 0) {
            Item.insertMany(defualtItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("defualt items added succefully!");
                }
            });
            res.redirect("/");
        }
        else {
            res.render("list", { listTitle: "Today", newListItems: itemsInDb, lists: lists, url:`http://localhost:${process.env.PORT}/` });
        }
    })
});

app.post("/", async function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    console.log(req.body);
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        await item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            if (err) {
                console.log(err);
            } else {
                if (foundList) {
                    foundList.items.push(item);
                    foundList.save();
                    res.redirect("/" + listName);
                }
            }
        })
    }
});

app.post("/delete", function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndDelete(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Sucessfully deleted the item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/" + listName);
            }
        });
    }
})

app.post("/createlist", function(req, res) {
    let customListName = req.body.listName;
    customListName = lodash.capitalize(customListName);
    console.log(customListName);
    List.findOne({ name: customListName }, function (err, foundList) {
        if (err) {
            console.log(err);
        } else {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defualtItems
                });
                list.save();
                res.redirect("/");
            } else {
                res.status(404).send("<h1>List Name already exists</h1>")
            }
        }
    })
})

app.post("/deletelist", function (req, res) {

    const listName = Object.keys(req.body)[0];
    console.log(listName);
    List.deleteOne({name: listName}, function(err){
        if(err){
            console.log(err);
        } else {
            console.log("list deleted successfully");
            res.redirect("/");
        }
    })
    
})


app.get("/:customListName", async function (req, res) {
    const lists = await List.find();

    let customListName = req.params.customListName;
    customListName = lodash.capitalize(customListName);
    
    const foundList = await List.findOne({ name: customListName })
    console.log(foundList);
    if (foundList===null) {
        console.log("list not found");
        res.redirect("/");
    } else {
        console.log(foundList);
        res.render('list', { listTitle: customListName, newListItems: foundList.items, lists: lists, url:`http://localhost:${process.env.PORT}/` })
    }
})

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("http://localhost:3000");
});
