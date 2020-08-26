import names
import random
import us
select_plist = ["location", "hobby_list", "language", "major", "ethnicity", "dorm", "gender"]
scores = {0:0.30, 1:0.25, 2:0.20, 3:0.15, 4:0.10}
dp = {0:0.05, 1:0.04, 2:0.03, 3:0.02, 4:0.01}

def user_generator():

    hobby_list = ["running", "swimming", "hiking", "music", "base ball", "basket ball", "soccer", "yoga", "baking", "dancing", "singing", "coding", "beach", "painting", "surfing", "road trips", "memes", "church"]
    dorms = ["off campus", "red bricks", "yakitutu", "pcv", "corallitos", "north mountain", "yosemiti", "something"]
    gend= ["male", "female"]
    location = us.STATES
    language = ["Mandarin",
                "Spanish",
                "English",
                "Hindi",
                "Portuguese",
                "Bengali",
                "Russian",
                "Japanese",
                "German",
                "Javanese",
                "Telugu",
                "Marathi",
                "Korean",
                "Tamil",
                "French",
                "Urdu",
                "Kantonese",
                "Turkish"]
    major = ["biology", "Cs", "SE", "ME", "BUSS", "CHEM", "PHY", "SOCIO", "ART", "MUSIC", "GEN_STUD", "ARCH", "BMED", "CENG", "ARENG", "AERO", "THEAT"]
# user_generator()

    name = names.get_full_name()
    email = name+"@calpoly.edu"
    email.replace(" ","")
    plst =  list_selector(select_plist,True)
    post = {"name":name,
            "user": "student",
            "nick_name": "not_set",
            "email": email,
            "pref_list": plst,
            "pref" : plst[0],
            "hobby_list": (list_selector(hobby_list)),
            "friend_list": [],
            "requested_list": [],
            "request_list": [],
            "gender": gend[random.randint(0,1)],
            "age": random.randint(18,25),
            "location": location[random.randint(0,len(location)-1)].name,
            "language": list_selector(language),
            "major": major[random.randint(0,len(major)-1)],
            "dorm": dorms[random.randint(0,len(dorms)-1)],
            "ethnicity": "American",
            }

    return post

def list_selector(list,flag = False):
    if flag:
        n = 5
    else:
        n = random.randint(3,6)
    lst=[]
    i=0
    while i<n:
        element =list[random.randint(0,len(list)-1)]
        if element not in lst:
            lst.append(element)
            i+=1
    return lst


