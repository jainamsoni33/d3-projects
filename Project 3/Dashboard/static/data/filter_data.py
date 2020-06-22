data = []

header = {}

with open("merged_data.csv") as file:
    i = 0
    for line in file:
        if i == 0:
            for idx, val in enumerate(line.strip().split(",")[1:]):
                header[val] = idx
        else:
            print(line.strip())
            break
        i += 1

print(header)