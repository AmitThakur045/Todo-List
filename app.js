const express = require("express"); // to get excess of express module
const bodyParser = require("body-parser");  // To get excess of body parser external node module for passing the data the data that user inputs in the form 
const mongoose = require("mongoose");   //  mongoose external node module to save the data in database 
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://amitthakur045:Balindra123@cluster0.ghycz.mongodb.net/todolistDB", 
{
    useNewUrlParser: true
})
.then( () => console.log("Compiled Successfully.."))
.catch( (err) => console.log(err));

// Creating the schema of the database
const itemsSchema = new mongoose.Schema ({
    name : String,
});

const Item = mongoose.model("Item", itemsSchema);

// Default elements
const item1 = new Item ({
    name : "Welcome to your todolist!"
});
const item2 = new Item ({
    name: "Hit the + button to aff a new item."
});
const item3 = new Item ({
    name: "Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Adding default value to todo list
const defaultList = async () => {
    try {
        
        const result = await Item.insertMany([defaultItems]);
        console.log("Successfully saved the default items to DB");
        res.redirect("/");
        // console.log(result);
    }catch(err) {
        console.log(err);
    }
}; 

const listSchema = new mongoose.Schema ({
    name : String,
    items : [itemsSchema]
});

const List = mongoose.model("List", listSchema);

// Delete Operation
const deleteItem = async (_id) => {
    try {
        const result = await Item.deleteOne({_id});
        console.log(result);
    }catch(err) {
        console.log(err);
    }
}

app.get("/", function(req, res) {
    const getDocument = async () => {
        try {
            let result = await Item.find();
            if(result.length === 0) {
                defaultList();
            } else {
                res.render("list", {listTitle: "Today", newListItems: result});
                // console.log(result);
            }
        }catch(err) {
            console.log(err);
        }
    }
    getDocument();
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList) {
        if(!err) {
            if(!foundList) {
                // Create a new List
                const list = new List({
                    name : customListName,
                    items : defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
})

// Adding New Item 
app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    })

    if(listName === 'Today') {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
})

// Deleting the item
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
        deleteItem(checkedItemId);
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: checkedItemId}}},
            function(err, foundList) {
                if(!err) {
                    res.redirect("/" + listName);
                }
            }               
        )
    }

})

// app.get("/work", function(req, res) {
//     res.render("list", {listTitle: "Work List", newListItems: workItems});
// })

app.listen(5000, function() {
    console.log("server started on port 5000");
});