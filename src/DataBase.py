import pymongo
import random
from DBcreator import*
from pymongo import MongoClient

scores = {0:0.30, 1:0.25, 2:0.20, 3:0.15, 4:0.10}
dp = {0:0.05, 1:0.04, 2:0.03, 3:0.02, 4:0.01}

cluster = MongoClient(
    "mongodb+srv://jay:jay123@mc-profiles.syvtn.mongodb.net/MC-Profiles?retryWrites=true&w=majority")

db = cluster["Mustang_Connect"]
collection = db["users"]
collections = collection.find({})


class user:
    def __init__(self, ObjID):
        lol = collection.find({"_id":ObjID})
        self.poi = lol[0]
        self.p_lst = (lol[0]).get("pref_list")
        self.pref = (lol[0]).get("pref")
        self.objID = ObjID
        print(".")

    def get_suggestion_list(self):  # returns the suggestion list
        final_list = {}
        selected_list = collections
        if self.pref != "hobby_list" or self.pref == "language":
            selected_list = collection.find({self.pref:self.get(self.pref)})
        for targets in selected_list:
            scr = 0
            target = user(targets.get("_id"))
            if target.objID == self.objID:
                continue
            print(target.get("name"))
            ######## calculation
            index=0
            for pref in self.p_lst:
                if pref == "language" or pref == "hobby_list":
                    scr +=  self.lsa(target,index,pref)
                else:
                    if self.get(pref) == target.get(pref):
                        scr+=scores.get(index)
                index += 1
            #############
            print(scr)
            if scr>0.6:
                final_list[target.objID] = scr
                print("added")
            if len(final_list) == 15:
                return final_list

    def lsa(self, target, index,lst):  # semi final score like 0.30
        match = 0
        scr = 0
        t_lst = target.get(lst)
        u_lst = self.get(lst)
        if self.get(lst):
            for item in u_lst:
                if item in t_lst:
                    match += 1
            scr = (((match / len(u_lst)) + (match / len(t_lst))) / 2)
            if scr>0.6:
                return scores.get(index)
            return scr*scores.get(index)

    def get(self,pref):
        lol = collection.find({"_id": self.objID})
        return (lol[0]).get(pref)

def main():
    poi = collection.find({"name":"Anthony Rome"})
    ob = poi[0].get("_id")
    usr1 = user(ob)
    print(usr1.get_suggestion_list())
    # for i in range(1000):
    #     collection.insert_one(user_generator())


if __name__ == '__main__':
    main()

